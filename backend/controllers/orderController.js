import pool from '../config/database.js';
import { ORDER_STATUS, USER_ROLES } from '../utils/constants.js';

// Create order (Customer/Guest)
export const createOrder = async (req, res, next) => {
  try {
    const { items, table_number, special_instructions } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order items are required' });
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const { food_id, quantity, special_instructions: itemInstructions } = item;

      if (!food_id || !quantity || quantity < 1) {
        return res.status(400).json({ error: 'Invalid order item' });
      }

      const foodResult = await pool.query('SELECT id, price, is_available FROM foods WHERE id = $1', [food_id]);
      if (foodResult.rows.length === 0) return res.status(404).json({ error: `Food ${food_id} not found` });

      const food = foodResult.rows[0];
      if (!food.is_available) return res.status(400).json({ error: `Food ${food_id} not available` });

      const subtotal = parseFloat(food.price) * quantity;
      totalAmount += subtotal;

      orderItems.push({ food_id, quantity, unit_price: food.price, subtotal, special_instructions: itemInstructions || null });
    }

    // Determine Table ID if table_number provided
    let tableId = null;
    if (table_number) {
      const tableResult = await pool.query('SELECT id FROM restaurant_tables WHERE table_number = $1', [table_number]);
      if (tableResult.rows.length > 0) tableId = tableResult.rows[0].id;
    }

    // Create order
    const orderResult = await pool.query(
      `INSERT INTO orders (user_id, guest_session_id, table_id, table_number, status, total_amount, special_instructions)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        !req.user.isGuest ? req.user.id : null,
        req.user.isGuest ? req.user.id : null,
        tableId || req.user.table_id || null,
        table_number || req.user.table_number || null,
        ORDER_STATUS.PENDING,
        totalAmount,
        special_instructions || null,
      ]
    );

    const order = orderResult.rows[0];

    // Create items & initial log
    for (const item of orderItems) {
      await pool.query(
        `INSERT INTO order_items (order_id, food_id, quantity, unit_price, subtotal, special_instructions)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [order.id, item.food_id, item.quantity, item.unit_price, item.subtotal, item.special_instructions]
      );
    }

    await pool.query(
      'INSERT INTO order_status_logs (order_id, new_status, changed_by) VALUES ($1, $2, $3)',
      [order.id, ORDER_STATUS.PENDING, !req.user.isGuest ? req.user.id : null]
    );

    res.status(201).json({ message: 'Order created successfully', orderId: order.id });
  } catch (error) {
    next(error);
  }
};

// ... existing getOrders and getOrderById remains similar ...
export const getOrders = async (req, res, next) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    let query = `
      SELECT o.*, u.full_name as customer_name, gs.guest_name, a.full_name as assigned_staff_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN guest_sessions gs ON o.guest_session_id = gs.id
      LEFT JOIN users a ON o.assigned_to = a.id
      WHERE 1=1
    `;
    const params = [];
    if (req.user.role === USER_ROLES.CUSTOMER) {
      if (req.user.isGuest) {
        query += ` AND o.guest_session_id = $1`;
        params.push(req.user.id);
      } else {
        query += ` AND o.user_id = $1`;
        params.push(req.user.id);
      }
    }

    if (status) {
      query += ` AND o.status = $${params.length + 1}`;
      params.push(status);
    }

    query += ` ORDER BY o.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    for (const order of result.rows) {
      const items = await pool.query('SELECT oi.*, f.name as food_name FROM order_items oi JOIN foods f ON oi.food_id = f.id WHERE oi.order_id = $1', [order.id]);
      order.items = items.rows;
    }
    res.json({ orders: result.rows });
  } catch (error) { next(error); }
};


export const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const order = result.rows[0];
    const items = await pool.query('SELECT oi.*, f.name as food_name FROM order_items oi JOIN foods f ON oi.food_id = f.id WHERE oi.order_id = $1', [id]);
    order.items = items.rows;
    res.json({ order });
  } catch (error) { next(error); }
};

// NEW: Analytics & Logging
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, assigned_to } = req.body;

    const currentOrder = await pool.query('SELECT status FROM orders WHERE id = $1', [id]);
    if (currentOrder.rows.length === 0) return res.status(404).json({ error: 'Order not found' });

    const oldStatus = currentOrder.rows[0].status;

    await pool.query('BEGIN');

    let updateQuery = 'UPDATE orders SET updated_at = CURRENT_TIMESTAMP';
    const params = [id];
    let paramCount = 1;

    if (status) {
      paramCount++;
      updateQuery += `, status = $${paramCount}`;
      params.push(status);
    }

    if (assigned_to !== undefined) {
      paramCount++;
      updateQuery += `, assigned_to = $${paramCount}`;
      params.push(assigned_to || null);
    }

    updateQuery += ' WHERE id = $1 RETURNING *';

    const result = await pool.query(updateQuery, params);

    if (status && status !== oldStatus) {
      await pool.query(
        'INSERT INTO order_status_logs (order_id, old_status, new_status, changed_by) VALUES ($1, $2, $3, $4)',
        [id, oldStatus, status, req.user.id]
      );
    }

    await pool.query('COMMIT');

    res.json({ message: 'Order updated', order: result.rows[0] });
  } catch (error) {
    await pool.query('ROLLBACK');
    next(error);
  }
};


export const getPrepTimeAnalytics = async (req, res, next) => {
  try {
    // Basic Load calculation: 5 mins per active preparing item
    const loadResult = await pool.query(
      `SELECT COUNT(*) as active_items 
       FROM order_items oi 
       JOIN orders o ON oi.order_id = o.id 
       WHERE o.status IN ('confirmed', 'preparing')`
    );

    const activeItems = parseInt(loadResult.rows[0].active_items);
    const estimatedWait = 10 + (activeItems * 2); // Base 10 mins + 2 mins per active item

    res.json({
      estimated_wait_minutes: estimatedWait,
      kitchen_load: activeItems > 10 ? 'high' : activeItems > 5 ? 'medium' : 'low',
      active_orders_count: activeItems
    });
  } catch (error) {
    next(error);
  }
};

