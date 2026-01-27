import pool from '../config/database.js';

// Get all payments with order details
export const getPayments = async (req, res, next) => {
    try {
        const { status, method, limit = 50, offset = 0 } = req.query;
        let query = `
            SELECT p.*, o.table_number, u.full_name as customer_name
            FROM payments p
            JOIN orders o ON p.order_id = o.id
            LEFT JOIN users u ON o.user_id = u.id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 0;

        if (req.user.role === 'manager' && req.user.branch_id) {
            paramCount++;
            query += ` AND (o.branch_id = $${paramCount} OR o.branch_id IS NULL)`;
            params.push(req.user.branch_id);
        }

        if (status) {
            paramCount++;
            query += ` AND p.status = $${paramCount}`;
            params.push(status);
        }

        if (method) {
            paramCount++;
            query += ` AND p.payment_method = $${paramCount}`;
            params.push(method);
        }

        query += ` ORDER BY p.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);
        res.json({ payments: result.rows });
    } catch (error) {
        next(error);
    }
};

// Update payment status
export const updatePaymentStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const result = await pool.query(
            'UPDATE payments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [status, id]
        );

        if (result.rows.length === 0) return res.status(404).json({ error: 'Payment not found' });

        // If payment is completed, we might want to auto-update order status or trigger receipt
        res.json({ message: 'Payment status updated', payment: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

// Get revenue statistics
export const getRevenueStats = async (req, res, next) => {
    try {
        const stats = await pool.query(`
            SELECT 
                SUM(CASE WHEN created_at >= CURRENT_DATE THEN amount ELSE 0 END) as daily_revenue,
                SUM(CASE WHEN created_at >= DATE_TRUNC('week', CURRENT_DATE) THEN amount ELSE 0 END) as weekly_revenue,
                SUM(CASE WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN amount ELSE 0 END) as monthly_revenue,
                COUNT(CASE WHEN payment_method = 'cash' THEN 1 END) as cash_transactions,
                COUNT(CASE WHEN payment_method = 'digital' THEN 1 END) as digital_transactions
            FROM payments p
            JOIN orders o ON p.order_id = o.id
            WHERE p.status = 'completed'
            ${req.user.role === 'manager' && req.user.branch_id ? `AND (o.branch_id = '${req.user.branch_id}' OR o.branch_id IS NULL)` : ''}
        `);

        res.json({ stats: stats.rows[0] });
    } catch (error) {
        next(error);
    }
};

// Create payment record (called after checkout)
export const createPayment = async (req, res, next) => {
    try {
        const { order_id, amount, payment_method, transaction_reference } = req.body;

        const result = await pool.query(
            `INSERT INTO payments (order_id, amount, payment_method, transaction_reference, status)
             VALUES ($1, $2, $3, $4, 'pending')
             RETURNING *`,
            [order_id, amount, payment_method, transaction_reference || null]
        );

        res.status(201).json({ payment: result.rows[0] });
    } catch (error) {
        next(error);
    }
};
