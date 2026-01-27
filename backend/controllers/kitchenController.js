import pool from '../config/database.js';
import { ORDER_STATUS } from '../utils/constants.js';

// Get active orders for the kitchen
export const getKitchenOrders = async (req, res, next) => {
    try {
        // Kitchen sees Pending, Confirmed, Preparing, and recently Ready orders
        const { branch_id } = req.user;
        let query = `
            SELECT 
                o.*, 
                u.full_name as customer_name,
                gs.guest_name,
                b.name as branch_name
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            LEFT JOIN guest_sessions gs ON o.guest_session_id = gs.id
            LEFT JOIN branches b ON o.branch_id = b.id
            WHERE (o.status IN ($1, $2, $3)
            OR (o.status = $4 AND o.updated_at > NOW() - INTERVAL '30 minutes'))
        `;
        const params = [ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED, ORDER_STATUS.PREPARING, ORDER_STATUS.READY];

        if (branch_id) {
            query += ` AND o.branch_id = $5`;
            params.push(branch_id);
        }

        query += ` ORDER BY 
                CASE 
                    WHEN o.priority = 'urgent' THEN 1
                    WHEN o.priority = 'high' THEN 2
                    ELSE 3 
                END,
                o.created_at ASC`;

        const result = await pool.query(query, params);

        const orders = result.rows;

        // Attach items to each order
        for (const order of orders) {
            const items = await pool.query(`
                SELECT oi.*, f.name as food_name, f.image_url
                FROM order_items oi
                JOIN foods f ON oi.food_id = f.id
                WHERE oi.order_id = $1
            `, [order.id]);
            order.items = items.rows;
        }

        res.json({ orders });
    } catch (error) {
        next(error);
    }
};

// Update order status from kitchen
export const updateKitchenStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, estimated_prep_time, priority } = req.body;

        const current = await pool.query('SELECT status FROM orders WHERE id = $1', [id]);
        if (current.rows.length === 0) return res.status(404).json({ error: 'Order not found' });

        const oldStatus = current.rows[0].status;

        const result = await pool.query(`
            UPDATE orders 
            SET status = COALESCE($1, status),
                estimated_prep_time = COALESCE($2, estimated_prep_time),
                priority = COALESCE($3, priority),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $4
            RETURNING *
        `, [status, estimated_prep_time, priority, id]);

        if (status && status !== oldStatus) {
            await pool.query(
                'INSERT INTO order_status_logs (order_id, old_status, new_status, changed_by) VALUES ($1, $2, $3, $4)',
                [id, oldStatus, status, req.user.id]
            );
        }

        res.json({ message: 'Kitchen status updated', order: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

// Toggle Food Availability (Out of Stock)
export const toggleFoodAvailability = async (req, res, next) => {
    try {
        const { foodId } = req.params;
        const { is_available, is_low_stock } = req.body;

        const result = await pool.query(`
            UPDATE foods 
            SET is_available = COALESCE($1, is_available),
                is_low_stock = COALESCE($2, is_low_stock),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING id, name, is_available, is_low_stock
        `, [is_available, is_low_stock, foodId]);

        if (result.rows.length === 0) return res.status(404).json({ error: 'Food item not found' });

        res.json({ message: 'Food availability updated', food: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

// Log Kitchen Safety/Hygiene checks
export const logKitchenCheck = async (req, res, next) => {
    try {
        const { check_type, details, severity } = req.body;
        const result = await pool.query(`
            INSERT INTO kitchen_logs (user_id, check_type, details, severity)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [req.user.id, check_type, details, severity || 'info']);

        res.status(201).json({ message: 'Kitchen check logged', log: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

// Get Kitchen Performance (Limited view)
export const getKitchenStats = async (req, res, next) => {
    try {
        const { branch_id } = req.user;
        const branchFilter = branch_id ? 'AND branch_id = $1' : '';
        const params = branch_id ? [branch_id] : [];

        const statsResult = await pool.query(`
            SELECT 
                COUNT(*) filter (where status = 'ready' OR status = 'served') as prepared_count,
                AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/60) filter (where status = 'ready') as avg_prep_time
            FROM orders
            WHERE created_at > CURRENT_DATE
            ${branchFilter}
        `, params);

        const peakResult = await pool.query(`
            SELECT EXTRACT(HOUR FROM created_at) as peak_hour, COUNT(*) as order_count
            FROM orders
            WHERE created_at > now() - INTERVAL '24 hours'
            ${branchFilter}
            GROUP BY peak_hour
            ORDER BY order_count DESC
            LIMIT 1
        `, params);

        const loadResult = await pool.query(`
            SELECT COUNT(*) as active_items FROM order_items oi 
            JOIN orders o ON oi.order_id = o.id 
            WHERE o.status IN ('confirmed', 'preparing')
            ${branchFilter.replace('branch_id', 'o.branch_id')}
        `, params);

        res.json({
            stats: statsResult.rows[0],
            peak_hour: peakResult.rows[0],
            kitchen_load: parseInt(loadResult.rows[0].active_items) > 10 ? 'high' : 'normal'
        });
    } catch (error) {
        next(error);
    }
};

