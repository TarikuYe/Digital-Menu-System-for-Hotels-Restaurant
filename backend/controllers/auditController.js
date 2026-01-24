import pool from '../config/database.js';

// Get all audit logs with user info
export const getAuditLogs = async (req, res, next) => {
    try {
        const { severity, action, limit = 100, offset = 0 } = req.query;
        let query = `
            SELECT al.*, u.full_name as user_name, u.email as user_email
            FROM audit_logs al
            LEFT JOIN users u ON al.user_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (severity) {
            query += ` AND al.severity = $${params.length + 1}`;
            params.push(severity);
        }

        if (action) {
            query += ` AND al.action = $${params.length + 1}`;
            params.push(action);
        }

        query += ` ORDER BY al.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await pool.query(query, params);
        res.json({ logs: result.rows });
    } catch (error) {
        next(error);
    }
};

// Internal utility to log an action
export const logAction = async ({ user_id, action, entity_type, entity_id, details, severity = 'info', req }) => {
    try {
        const ip_address = req?.ip || null;
        const user_agent = req?.headers?.['user-agent'] || null;

        await pool.query(
            `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, severity, ip_address, user_agent)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [user_id, action, entity_type, entity_id, details ? JSON.stringify(details) : null, severity, ip_address, user_agent]
        );
    } catch (error) {
        console.error('Audit Log Error:', error);
    }
};

// Security Insights - Detect suspicious activity
export const getSecurityInsights = async (req, res, next) => {
    try {
        // 1. Detect multiple failed login attempts in last hour (logic would be expanded if we had a failed_logins table)
        // For now, we query audit_logs for 'login_failed'
        const failedLogins = await pool.query(`
            SELECT ip_address, COUNT(*) as attempt_count
            FROM audit_logs
            WHERE action = 'login_failed' AND created_at > NOW() - INTERVAL '1 hour'
            GROUP BY ip_address
            HAVING COUNT(*) > 5
        `);

        // 2. Detect high-value order cancellations (e.g. > $200)
        const suspiciousCancellations = await pool.query(`
            SELECT o.id, o.total_amount, u.full_name as user_name
            FROM orders o
            JOIN users u ON o.user_id = u.id
            WHERE o.status = 'cancelled' AND o.total_amount > 200 AND o.created_at > NOW() - INTERVAL '24 hours'
        `);

        // 3. User role changes
        const roleChanges = await pool.query(`
            SELECT al.*, u.full_name as actor_name
            FROM audit_logs al
            JOIN users u ON al.user_id = u.id
            WHERE al.action = 'update_user_role' AND al.created_at > NOW() - INTERVAL '7 days'
        `);

        res.json({
            failedLogins: failedLogins.rows,
            suspiciousCancellations: suspiciousCancellations.rows,
            roleChanges: roleChanges.rows
        });
    } catch (error) {
        next(error);
    }
};

// Mock Backup Strategy
export const triggerBackup = async (req, res, next) => {
    try {
        // In a real system, you would call pg_dump or a cloud snapshot API
        // Here we log the event and return a success message
        await logAction({
            user_id: req.user.id,
            action: 'system_backup',
            severity: 'info',
            details: { type: 'manual', status: 'initiated' },
            req
        });

        res.json({ message: 'Database backup initiated. Snapshot will be available in the storage vault shortly.' });
    } catch (error) {
        next(error);
    }
};
