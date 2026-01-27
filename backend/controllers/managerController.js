
import pool from '../config/database.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const { branch_id, role } = req.user;
    const isManager = role === 'manager';

    // Base where clause for branch isolation
    const branchFilter = isManager && branch_id ? 'AND (branch_id = $1 OR branch_id IS NULL)' : '';
    const params = isManager && branch_id ? [branch_id] : [];

    // 1. Total Revenue Today vs Yesterday
    const revenueRes = await pool.query(`
      SELECT 
        SUM(CASE WHEN created_at::date = CURRENT_DATE THEN total_amount ELSE 0 END) as today,
        SUM(CASE WHEN created_at::date = CURRENT_DATE - 1 THEN total_amount ELSE 0 END) as yesterday
      FROM orders 
      WHERE status != 'cancelled' 
      AND created_at::date >= CURRENT_DATE - 1
      ${branchFilter}
    `, params);

    const revenue = parseFloat(revenueRes.rows[0].today || 0);
    const revenueYesterday = parseFloat(revenueRes.rows[0].yesterday || 0);
    const revenueTrend = revenueYesterday > 0 ? Math.round(((revenue - revenueYesterday) / revenueYesterday) * 100) : 0;

    // 2. Total Orders Today vs Yesterday
    const ordersRes = await pool.query(`
      SELECT 
        COUNT(CASE WHEN created_at::date = CURRENT_DATE THEN 1 END) as today,
        COUNT(CASE WHEN created_at::date = CURRENT_DATE - 1 THEN 1 END) as yesterday
      FROM orders 
      WHERE created_at::date >= CURRENT_DATE - 1
      ${branchFilter}
    `, params);

    const totalOrders = parseInt(ordersRes.rows[0].today || 0);
    const ordersYesterday = parseInt(ordersRes.rows[0].yesterday || 0);
    const ordersTrend = ordersYesterday > 0 ? Math.round(((totalOrders - ordersYesterday) / ordersYesterday) * 100) : 0;

    // 3. Active Tables
    const tablesRes = await pool.query(`
      SELECT COUNT(*) as count 
      FROM restaurant_tables 
      WHERE status = 'occupied'
      ${branchFilter}
    `, params);
    const activeTables = parseInt(tablesRes.rows[0].count);

    // 4. Pending Orders (Backlog)
    const pendingRes = await pool.query(`
      SELECT COUNT(*) as count 
      FROM orders 
      WHERE status IN ('pending', 'confirmed', 'preparing')
      ${branchFilter}
    `, params);
    const pendingOrders = parseInt(pendingRes.rows[0].count);

    // 5. Staff Count
    const staffRes = await pool.query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE role IN ('staff', 'kitchen', 'cashier')
      ${isManager && branch_id ? 'AND (branch_id = $1 OR branch_id IS NULL)' : ''}
    `, params);
    const staffCount = parseInt(staffRes.rows[0].count);

    // 6. Average Service Time (Today vs Yesterday)
    const avgTimeRes = await pool.query(`
      SELECT 
        AVG(CASE WHEN o.created_at::date = CURRENT_DATE THEN EXTRACT(EPOCH FROM (l.changed_at - o.created_at))/60 END) as today,
        AVG(CASE WHEN o.created_at::date = CURRENT_DATE - 1 THEN EXTRACT(EPOCH FROM (l.changed_at - o.created_at))/60 END) as yesterday
      FROM orders o
      JOIN order_status_logs l ON o.id = l.order_id
      WHERE l.new_status = 'served'
      AND o.created_at::date >= CURRENT_DATE - 1
      ${branchFilter.replaceAll('branch_id', 'o.branch_id')}
    `, params);

    const avgServiceTime = Math.round(parseFloat(avgTimeRes.rows[0].today) || 0);
    const avgServiceTimeYesterday = Math.round(parseFloat(avgTimeRes.rows[0].yesterday) || 0);
    const serviceImprovement = avgServiceTimeYesterday > 0
      ? Math.round(((avgServiceTimeYesterday - avgServiceTime) / avgServiceTimeYesterday) * 100)
      : 0;

    res.json({
      revenue,
      revenueTrend,
      totalOrders,
      ordersTrend,
      activeTables,
      pendingOrders,
      staffCount,
      avgServiceTime,
      serviceImprovement
    });
  } catch (error) {
    next(error);
  }
};

export const getRecentActivity = async (req, res, next) => {
  try {
    const { branch_id, role } = req.user;
    const isManager = role === 'manager';

    const branchFilter = isManager && branch_id ? 'AND (o.branch_id = $1 OR o.branch_id IS NULL)' : '';
    const params = isManager && branch_id ? [branch_id] : [];

    // Recent orders with customer info
    const query = `
      SELECT o.id, o.table_number, o.status, o.total_amount, o.created_at,
             u.full_name as customer_name, gs.guest_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN guest_sessions gs ON o.guest_session_id = gs.id
      WHERE 1=1 ${branchFilter}
      ORDER BY o.created_at DESC
      LIMIT 20
    `;
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

export const getFinancialStats = async (req, res, next) => {
  try {
    const { branch_id, role } = req.user;
    const isManager = role === 'manager';

    const branchFilter = isManager && branch_id ? 'AND (o.branch_id = $1 OR o.branch_id IS NULL)' : '';
    const params = isManager && branch_id ? [branch_id] : [];

    const query = `
      SELECT p.payment_method, COALESCE(SUM(p.amount), 0) as total
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      WHERE p.status = 'completed'
      AND p.created_at::date = CURRENT_DATE
      ${branchFilter}
      GROUP BY p.payment_method
    `;
    const result = await pool.query(query, params);

    // Format for frontend
    const financialData = {
      cash: 0,
      card: 0,
      digital: 0,
      mobile: 0
    };

    result.rows.forEach(row => {
      const method = row.payment_method.toLowerCase();
      if (financialData.hasOwnProperty(method)) {
        financialData[method] = parseFloat(row.total);
      }
    });

    res.json(financialData);
  } catch (error) {
    next(error);
  }
};
