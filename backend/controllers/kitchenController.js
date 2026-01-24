
import pool from '../config/database.js';

export const getKitchenOrders = async (req, res, next) => {
    try {
        // Fetch orders that are relevant to the kitchen (pending, preparing, ready)
        // We typically don't show 'served' or 'cancelled' in the active queue,
        // although 'ready' needs to be there so they can verify pickup.
        const result = await pool.query(
            `SELECT o.id, o.table_number, o.status, o.created_at, o.special_instructions,
              json_agg(
                json_build_object(
                  'id', oi.id,
                  'food_name', f.name,
                  'quantity', oi.quantity,
                  'special_instructions', oi.special_instructions
                )
              ) as items
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       JOIN foods f ON oi.food_id = f.id
       WHERE o.status IN ('pending', 'preparing', 'ready')
       GROUP BY o.id
       ORDER BY o.created_at ASC`
        );

        res.json(result.rows);
    } catch (error) {
        next(error);
    }
};

export const updateOrderStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending', 'preparing', 'ready', 'served', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const result = await pool.query(
            `UPDATE orders 
       SET status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING id, status, updated_at`,
            [status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        next(error);
    }
};
