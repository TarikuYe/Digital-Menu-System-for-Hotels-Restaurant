import pool from '../config/database.js';
import { USER_ROLES } from '../utils/constants.js';
import { emitToRole, emitToAll } from '../utils/socket.js';

// --- Announcements ---

export const getAnnouncements = async (req, res, next) => {
    try {
        const { role, active_only = 'false' } = req.query;
        let query = 'SELECT a.*, u.full_name as sender_name FROM announcements a LEFT JOIN users u ON a.sender_id = u.id WHERE 1=1';
        const params = [];

        if (active_only === 'true') {
            query += ' AND a.is_active = true AND (a.expires_at IS NULL OR a.expires_at > CURRENT_TIMESTAMP)';
        }

        if (role) {
            query += ` AND (a.target_role = 'all' OR a.target_role = $1)`;
            params.push(role);
        }

        query += ' ORDER BY a.created_at DESC';
        const result = await pool.query(query, params);
        res.json({ announcements: result.rows });
    } catch (error) {
        next(error);
    }
};

export const createAnnouncement = async (req, res, next) => {
    try {
        const { title, content, target_role, priority, expires_at } = req.body;

        const result = await pool.query(
            `INSERT INTO announcements (sender_id, title, content, target_role, priority, expires_at)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [req.user.id, title, content, target_role || 'all', priority || 'info', expires_at || null]
        );

        const announcement = result.rows[0];

        // Emit real-time announcement
        if (announcement.target_role === 'all') {
            emitToAll('new_announcement', announcement);
        } else {
            emitToRole(announcement.target_role, 'new_announcement', announcement);
        }

        res.status(201).json({ message: 'Announcement created', announcement });
    } catch (error) {
        next(error);
    }
};

export const deleteAnnouncement = async (req, res, next) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM announcements WHERE id = $1', [id]);
        res.json({ message: 'Announcement deleted' });
    } catch (error) {
        next(error);
    }
};

// --- Personal Notifications / Staff Alerts ---

export const getNotifications = async (req, res, next) => {
    try {
        const result = await pool.query(
            'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
            [req.user.id]
        );
        res.json({ notifications: result.rows });
    } catch (error) {
        next(error);
    }
};

export const sendStaffAlert = async (req, res, next) => {
    try {
        const { recipient_role, title, message, priority, table_number } = req.body;

        // If it's a table service request, we update the table status automatically
        if (table_number) {
            await pool.query(
                "UPDATE restaurant_tables SET status = 'occupied', updated_at = CURRENT_TIMESTAMP WHERE table_number = $1 AND status = 'available'",
                [table_number]
            );
            // Notify all staff that table status changed
            emitToRole('staff', 'table_status_updated', { table_number, status: 'occupied' });
            emitToRole('waiter', 'table_status_updated', { table_number, status: 'occupied' });
            emitToRole('manager', 'table_status_updated', { table_number, status: 'occupied' });
            emitToRole('admin', 'table_status_updated', { table_number, status: 'occupied' });
        }

        // Logic to find a specific online waiter if the role is staff/waiter
        let targetStaffIds = [];
        let assignedWaiter = null;

        if (recipient_role === 'staff' || recipient_role === 'waiter') {
            // Find one online waiter first (least busy could be better, but let's start with any online)
            const onlineWaiterRes = await pool.query(
                "SELECT id, full_name FROM users WHERE (role = 'staff' OR role = 'waiter') AND status = 'online' LIMIT 1"
            );

            if (onlineWaiterRes.rows.length > 0) {
                assignedWaiter = onlineWaiterRes.rows[0];
                targetStaffIds = [assignedWaiter.id];
                console.log(`🎯 Assigned specific online waiter: ${assignedWaiter.full_name} (${assignedWaiter.id})`);
            }
        }

        // Fallback: Notify all staff with the role if no specific waiter assigned
        if (targetStaffIds.length === 0) {
            const staffRes = await pool.query(
                "SELECT id FROM users WHERE role = $1 OR (role = 'waiter' AND $1 = 'staff')",
                [recipient_role]
            );
            targetStaffIds = staffRes.rows.map(s => s.id);
        }

        console.log(`🔔 Sending staff alert to ${targetStaffIds.length} users. Assigned: ${assignedWaiter?.full_name || 'None'}`);

        if (targetStaffIds.length === 0) {
            console.log(`⚠️ No ${recipient_role} found. Falling back to managers.`);
            const managerRes = await pool.query("SELECT id FROM users WHERE role = 'manager' OR role = 'admin'");
            targetStaffIds = managerRes.rows.map(m => m.id);
        }

        // Create individual notifications
        if (targetStaffIds.length > 0) {
            const values = targetStaffIds.map((id, idx) => `($${idx * 5 + 1}, $${idx * 5 + 2}, $${idx * 5 + 3}, $${idx * 5 + 4}, $${idx * 5 + 5})`).join(', ');
            const params = [];
            targetStaffIds.forEach(id => {
                params.push(id, 'system', title, message, priority || 'high');
            });

            await pool.query(
                `INSERT INTO notifications (user_id, notification_type, title, message, priority) VALUES ${values}`,
                params
            );
        }

        // Save to messages table for chat history
        const senderName = req.user?.isGuest ? `Guest @ Table ${table_number}` : (req.user?.full_name || 'System');
        await pool.query(
            `INSERT INTO messages (sender_id, recipient_role, recipient_id, message, priority, table_number)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [req.user?.isGuest ? null : req.user?.id, recipient_role, assignedWaiter?.id || null, message, priority || 'info', table_number || null]
        );

        // Emit real-time alert
        const alertData = {
            title,
            message: assignedWaiter ? `${message} (Assigned to you)` : message,
            priority: priority || 'high',
            sender: senderName,
            table_number: table_number || null,
            assigned_to: assignedWaiter?.id || null,
            created_at: new Date()
        };

        if (assignedWaiter) {
            emitToUser(assignedWaiter.id, 'staff_alert', alertData);
            // Also notify managers of the assignment
            emitToRole('manager', 'staff_alert', { ...alertData, title: `[Assigned] ${title}` });
        } else {
            emitToRole(recipient_role, 'staff_alert', alertData);
        }

        // Always notify admin
        if (recipient_role !== 'admin') {
            emitToRole('admin', 'staff_alert', alertData);
        }

        res.json({
            message: assignedWaiter
                ? `Alert sent to assigned waiter ${assignedWaiter.full_name}`
                : `Alert sent to ${targetStaffIds.length} staff members`
        });
    } catch (error) {
        next(error);
    }
};

// --- Real-time Chat ---

export const getMessages = async (req, res, next) => {
    try {
        const { role, branch_id, id: userId } = req.user;

        // Basic query
        let query = `
            SELECT m.*, u.full_name as sender_name, u.role as sender_role 
            FROM messages m 
            LEFT JOIN users u ON m.sender_id = u.id 
            WHERE (
                m.recipient_role = $1 
                OR m.recipient_role = 'all' 
                OR m.recipient_id = $2
                OR (m.sender_id IS NOT NULL AND m.sender_id = $2)
            )
        `;
        const params = [role, userId];

        // Group by branch if user is not a global admin
        // (Assuming admins might want to see global history, but staff are restricted)
        if (role !== USER_ROLES.ADMIN && branch_id) {
            query += ` AND (u.branch_id = $3 OR u.branch_id IS NULL)`; // IS NULL for system/global messages
            params.push(branch_id);
        }

        query += ` ORDER BY m.created_at DESC LIMIT 100`;

        const result = await pool.query(query, params);

        // Post-process to handle guest messages that have no sender_name from the join
        const messages = result.rows.map(msg => {
            if (!msg.sender_id && !msg.sender_name) {
                return {
                    ...msg,
                    sender_name: msg.table_number ? `Guest @ Table ${msg.table_number}` : 'Guest',
                    sender_role: 'guest'
                };
            }
            return msg;
        });

        res.json({ messages: messages.reverse() });
    } catch (error) {
        next(error);
    }
};

export const sendMessage = async (req, res, next) => {
    try {
        const { recipient_role, recipient_id, message, priority, table_number } = req.body;

        const result = await pool.query(
            `INSERT INTO messages (sender_id, recipient_role, recipient_id, message, priority, table_number)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [req.user.isGuest ? null : req.user.id, recipient_role, recipient_id || null, message, priority || 'info', table_number || null]
        );

        const savedMessage = result.rows[0];

        // Add sender info for UI
        savedMessage.sender_name = req.user.full_name;
        savedMessage.sender_role = req.user.role;

        // Emit to targeted audience
        if (recipient_id) {
            emitToUser(recipient_id, 'new_chat_message', savedMessage);
            // Also notify sender if they want to see it pop up? (Usually handled by UI add)
        } else if (recipient_role === 'all') {
            emitToAll('new_chat_message', savedMessage);
        } else {
            emitToRole(recipient_role, 'new_chat_message', savedMessage);
        }

        res.status(201).json({ message: 'Message sent', chatMessage: savedMessage });
    } catch (error) {
        next(error);
    }
};


export const markNotificationRead = async (req, res, next) => {
    try {
        const { id } = req.params;
        await pool.query(
            "UPDATE notifications SET status = 'read', read_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2",
            [id, req.user.id]
        );
        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        next(error);
    }
};

// --- Notification Settings (Configuration) ---

export const getCommSettings = async (req, res, next) => {
    try {
        // Fetch from system_settings table (created in Actor Model migration)
        const result = await pool.query(
            `SELECT setting_key, setting_value FROM system_settings 
             WHERE setting_key IN ('notify_email', 'notify_sms', 'notify_push', 'order_status_alerts')`
        );

        // Transform to object
        const settings = {};
        result.rows.forEach(r => settings[r.setting_key] = r.setting_value);

        res.json({ settings });
    } catch (error) {
        next(error);
    }
};

export const updateCommSettings = async (req, res, next) => {
    try {
        const { settings } = req.body; // e.g., { notify_email: 'true', order_status_alerts: 'true' }

        for (const [key, value] of Object.entries(settings)) {
            await pool.query(
                `INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_by)
                 VALUES ($1, $2, 'boolean', $3)
                 ON CONFLICT (setting_key) DO UPDATE SET setting_value = $2, updated_at = CURRENT_TIMESTAMP`,
                [key, value.toString(), req.user.id]
            );
        }

        res.json({ message: 'Settings updated' });
    } catch (error) {
        next(error);
    }
};
// Get list of staff members with status
export const getStaffList = async (req, res, next) => {
    try {
        const result = await pool.query(
            "SELECT id, full_name, role, status, email FROM users WHERE role IN ('staff', 'waiter', 'manager') ORDER BY status DESC, full_name ASC"
        );
        res.json({ staff: result.rows });
    } catch (error) {
        next(error);
    }
};
