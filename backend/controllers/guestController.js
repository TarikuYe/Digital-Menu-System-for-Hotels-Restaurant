
import pool from '../config/database.js';
import { generateToken } from '../utils/qrCodeGenerator.js';

// Verify Table QR Token
export const verifyTableToken = async (req, res, next) => {
    try {
        const { token } = req.params;

        const result = await pool.query(
            'SELECT id, table_number, capacity, status FROM restaurant_tables WHERE qr_code_token = $1',
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Invalid QR Code' });
        }

        const table = result.rows[0];

        // Check if table is occupied/reserved? Maybe not block it, just warn?
        // For now, simple return.
        res.json({ table });
    } catch (error) {
        next(error);
    }
};

// Start Guest Session
export const startSession = async (req, res, next) => {
    try {
        const { table_id, guest_name } = req.body;

        if (!table_id) {
            return res.status(400).json({ error: 'Table ID is required' });
        }

        // Check if table exists
        const tableCheck = await pool.query('SELECT id, table_number FROM restaurant_tables WHERE id = $1', [table_id]);
        if (tableCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Table not found' });
        }
        const tableNumber = tableCheck.rows[0].table_number;

        // Generate Session Token
        const sessionToken = generateToken();
        const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000); // 6 hours expiration

        // Create Guest Session
        // We could check if there is an active session for this table, but multiple guests might sit at same table?
        // For now, create a new session per device (per request).
        const result = await pool.query(
            `INSERT INTO guest_sessions (table_id, session_token, guest_name, expires_at)
       VALUES ($1, $2, $3, $4)
       RETURNING id, session_token, expires_at`,
            [table_id, sessionToken, guest_name || 'Guest', expiresAt]
        );

        // Update Table Status to 'occupied' if it's currently 'available'
        await pool.query(
            `UPDATE restaurant_tables SET status = 'occupied' WHERE id = $1 AND status = 'available'`,
            [table_id]
        );

        res.status(201).json({
            session: result.rows[0],
            message: 'Guest session started'
        });

        // Notify staff that a table is now occupied by a guest
        import('../utils/socket.js').then(({ emitToRole, emitToAll }) => {
            const session = result.rows[0];
            const notificationData = {
                table_id,
                table_number: tableNumber,
                guest_name: guest_name || 'Guest',
                session_id: session.id,
                status: 'occupied'
            };
            // Notify all relevant staff roles
            ['staff', 'waiter', 'manager', 'admin'].forEach(role => {
                emitToRole(role, 'guest_session_started', notificationData);
            });
            // Also standard table update
            emitToAll('table_status_updated', { table_id, table_number: tableNumber, status: 'occupied' });
        }).catch(err => console.error('Socket notification failed:', err));
    } catch (error) {
        next(error);
    }
};

// Get Session Status (re-validate token)
export const getSessionStatus = async (req, res, next) => {
    // This endpoint is protected by auth middleware (Guest token)
    // So if it reaches here, session is valid.
    res.json({ session: req.user });
};
