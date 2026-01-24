
import pool from '../config/database.js';

async function debugOrders() {
    try {
        const query = `SELECT o.id, o.table_number, o.status, o.created_at, o.special_instructions,
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
       ORDER BY o.created_at ASC`;

        const res = await pool.query(query);
        console.log('Kitchen Query Result Count:', res.rows.length);
        console.log('Kitchen Query Result:', JSON.stringify(res.rows, null, 2));

        process.exit(0);
    } catch (e) {
        console.error('Query Failed:', e);
        process.exit(1);
    }
}

debugOrders();
