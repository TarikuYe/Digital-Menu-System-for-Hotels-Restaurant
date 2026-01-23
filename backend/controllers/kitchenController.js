import pool from '../config/database.js';
import { ORDER_STATUS } from '../utils/constants.js';

/**
 * Get all orders for kitchen display
 * Shows pending, confirmed, and preparing orders
 */
export const getKitchenOrders = async (req, res) => {
    try {
        const { status } = req.query;

        // Kitchen sees orders that need attention
        const allowedStatuses = ['pending', 'confirmed', 'preparing'];
        let statusFilter = allowedStatuses;

        if (status) {
            const requestedStatuses = status.split(',');
            statusFilter = requestedStatuses.filter(s => allowedStatuses.includes(s));
        }

        const result = await pool.query(
            `SELECT 
        o.id,
        o.table_number,
        o.status,
        o.total_amount,
        o.special_instructions,
        o.created_at,
        o.updated_at,
        u.full_name as customer_name,
        u.email as customer_email,
        json_agg(
          json_build_object(
            'id', oi.id,
            'food_id', oi.food_id,
            'food_name', f.name,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'special_instructions', oi.special_instructions,
            'spice_level', f.spice_level,
            'preparation_time', f.preparation_time
          ) ORDER BY oi.created_at
        ) as items
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN foods f ON oi.food_id = f.id
      WHERE o.status = ANY($1)
      GROUP BY o.id, u.full_name, u.email
      ORDER BY 
        CASE o.status
          WHEN 'pending' THEN 1
          WHEN 'confirmed' THEN 2
          WHEN 'preparing' THEN 3
        END,
        o.created_at ASC`,
            [statusFilter]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching kitchen orders:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Update order status from kitchen
 * Kitchen can set: confirmed, preparing, ready
 */
export const updateKitchenOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Kitchen can only set specific statuses
        const allowedStatuses = ['confirmed', 'preparing', 'ready'];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                error: 'Invalid status',
                message: `Kitchen can only set status to: ${allowedStatuses.join(', ')}`
            });
        }

        // Get current order status
        const currentOrder = await pool.query(
            'SELECT status FROM orders WHERE id = $1',
            [id]
        );

        if (currentOrder.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const oldStatus = currentOrder.rows[0].status;

        // Update order status
        const result = await pool.query(
            'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [status, id]
        );

        // Log status change
        await pool.query(
            'INSERT INTO order_status_logs (order_id, old_status, new_status, changed_by) VALUES ($1, $2, $3, $4)',
            [id, oldStatus, status, req.user.userId]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating kitchen order status:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Update food availability from kitchen
 * Kitchen can mark items as unavailable when out of stock
 */
export const updateFoodAvailability = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_available } = req.body;

        if (typeof is_available !== 'boolean') {
            return res.status(400).json({ error: 'is_available must be a boolean' });
        }

        const result = await pool.query(
            'UPDATE foods SET is_available = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [is_available, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Food item not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating food availability:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get kitchen statistics
 * Shows active orders count, average prep time, etc.
 */
export const getKitchenStats = async (req, res) => {
    try {
        const stats = await pool.query(
            `SELECT 
        COUNT(*) FILTER (WHERE status = 'pending') as pending_orders,
        COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_orders,
        COUNT(*) FILTER (WHERE status = 'preparing') as preparing_orders,
        COUNT(*) FILTER (WHERE status = 'ready') as ready_orders,
        COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as today_orders,
        AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/60) FILTER (WHERE status = 'ready' AND DATE(created_at) = CURRENT_DATE) as avg_prep_time_minutes
      FROM orders
      WHERE status IN ('pending', 'confirmed', 'preparing', 'ready') OR DATE(created_at) = CURRENT_DATE`
        );

        res.json(stats.rows[0]);
    } catch (error) {
        console.error('Error fetching kitchen stats:', error);
        res.status(500).json({ error: error.message });
    }
};
