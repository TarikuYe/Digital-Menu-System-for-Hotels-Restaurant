import pool from '../config/database.js';
import { USER_ROLES } from '../utils/constants.js';

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

        res.status(201).json({ message: 'Announcement created', announcement: result.rows[0] });
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
        const { recipient_role, title, message, priority } = req.body;

        // Get all users with that role
        const staffRes = await pool.query('SELECT id FROM users WHERE role = $1', [recipient_role]);
        const staffIds = staffRes.rows.map(s => s.id);

        if (staffIds.length === 0) {
            return res.status(404).json({ error: 'No staff found with this role' });
        }

        // Create individual notifications
        const values = staffIds.map((id, idx) => `($${idx * 5 + 1}, $${idx * 5 + 2}, $${idx * 5 + 3}, $${idx * 5 + 4}, $${idx * 5 + 5})`).join(', ');
        const params = [];
        staffIds.forEach(id => {
            params.push(id, 'system', title, message, priority || 'high');
        });

        await pool.query(
            `INSERT INTO notifications (user_id, notification_type, title, message, priority) VALUES ${values}`,
            params
        );

        res.json({ message: `Alert sent to ${staffIds.length} staff members` });
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
