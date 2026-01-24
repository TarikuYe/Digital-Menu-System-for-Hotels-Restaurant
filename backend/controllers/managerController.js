
import pool from '../config/database.js';

export const getDashboardStats = async (req, res, next) => {
    try {
        // 1. Total Revenue Today
        const revenueQuery = `
      SELECT COALESCE(SUM(total_amount), 0) as total 
      FROM orders 
      WHERE status != 'cancelled' 
      AND created_at::date = CURRENT_DATE
    `;
        const revenueRes = await pool.query(revenueQuery);
        const revenue = parseFloat(revenueRes.rows[0].total);

        // 2. Total Orders Today
        const ordersQuery = `
      SELECT COUNT(*) as count 
      FROM orders 
      WHERE created_at::date = CURRENT_DATE
    `;
        const ordersRes = await pool.query(ordersQuery);
        const totalOrders = parseInt(ordersRes.rows[0].count);

        // 3. Active Tables
        const tablesQuery = `
      SELECT COUNT(*) as count 
      FROM restaurant_tables 
      WHERE status = 'occupied'
    `;
        const tablesRes = await pool.query(tablesQuery);
        const activeTables = parseInt(tablesRes.rows[0].count);

        // 4. Pending Orders (Backlog)
        const pendingQuery = `
      SELECT COUNT(*) as count 
      FROM orders 
      WHERE status IN ('pending', 'preparing')
    `;
        const pendingRes = await pool.query(pendingQuery);
        const pendingOrders = parseInt(pendingRes.rows[0].count);

        res.json({
            revenue,
            totalOrders,
            activeTables,
            pendingOrders
        });
    } catch (error) {
        next(error);
    }
};

export const getRecentActivity = async (req, res, next) => {
    try {
        // Recent orders with customer info
        const query = `
      SELECT o.id, o.table_number, o.status, o.total_amount, o.created_at,
             u.full_name as customer_name, gs.guest_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN guest_sessions gs ON o.guest_session_id = gs.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        next(error);
    }
};
