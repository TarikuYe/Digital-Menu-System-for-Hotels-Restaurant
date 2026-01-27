import pool from '../config/database.js';
import { ORDER_STATUS, USER_ROLES } from '../utils/constants.js';
import { emitToRole, emitToOrder } from '../utils/socket.js';

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

    // Determine Table ID and Branch ID
    let tableId = null;
    let branchId = null;

    if (table_number) {
      const tableResult = await pool.query('SELECT id, branch_id FROM restaurant_tables WHERE table_number = $1', [table_number]);
      if (tableResult.rows.length > 0) {
        tableId = tableResult.rows[0].id;
        branchId = tableResult.rows[0].branch_id;
      }
    } else if (req.user.table_id) {
      const tableResult = await pool.query('SELECT branch_id FROM restaurant_tables WHERE id = $1', [req.user.table_id]);
      if (tableResult.rows.length > 0) branchId = tableResult.rows[0].branch_id;
    }

    // Create order
    const orderResult = await pool.query(
      `INSERT INTO orders (user_id, guest_session_id, table_id, table_number, status, total_amount, special_instructions, branch_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        !req.user.isGuest ? req.user.id : null,
        req.user.isGuest ? req.user.id : null,
        tableId || req.user.table_id || null,
        table_number || req.user.table_number || null,
        ORDER_STATUS.PENDING,
        totalAmount,
        special_instructions || null,
        branchId || req.user.branch_id || null
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

    // Emit real-time notification
    const orderNotification = {
      message: `New order from Table ${order.table_number}`,
      orderId: order.id,
      tableNumber: order.table_number,
      total: order.total_amount
    };
    emitToRole(USER_ROLES.KITCHEN, 'new_order', orderNotification);
    emitToRole(USER_ROLES.MANAGER, 'new_order', orderNotification);
    emitToRole(USER_ROLES.ADMIN, 'new_order', orderNotification);
    emitToRole(USER_ROLES.STAFF, 'new_order', orderNotification);

    res.status(201).json({ message: 'Order created successfully', orderId: order.id, order });
  } catch (error) {
    next(error);
  }
};

// Get all orders with filtering
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
        query += ` AND o.guest_session_id = $${params.length + 1}`;
        params.push(req.user.id);
      } else {
        query += ` AND o.user_id = $${params.length + 1}`;
        params.push(req.user.id);
      }
    } else if ([USER_ROLES.MANAGER, USER_ROLES.STAFF, USER_ROLES.KITCHEN].includes(req.user.role) && req.user.branch_id) {
      // Staff/Managers/Kitchen only see their branch orders (and unassigned orders for safety)
      query += ` AND (o.branch_id = $${params.length + 1} OR o.branch_id IS NULL)`;
      params.push(req.user.branch_id);
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

// Get single order detail
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

    const currentOrder = await pool.query('SELECT status, table_number FROM orders WHERE id = $1', [id]);
    if (currentOrder.rows.length === 0) return res.status(404).json({ error: 'Order not found' });

    const oldStatus = currentOrder.rows[0].status;
    const tableNumber = currentOrder.rows[0].table_number;

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

    if (req.body.priority) {
      paramCount++;
      updateQuery += `, priority = $${paramCount}`;
      params.push(req.body.priority);
    }

    if (req.body.total_amount) {
      paramCount++;
      updateQuery += `, total_amount = $${paramCount}`;
      params.push(req.body.total_amount);
    }

    updateQuery += ' WHERE id = $1 RETURNING *';

    const result = await pool.query(updateQuery, params);
    const updatedOrder = result.rows[0];

    if (status && status !== oldStatus) {
      await pool.query(
        'INSERT INTO order_status_logs (order_id, old_status, new_status, changed_by) VALUES ($1, $2, $3, $4)',
        [id, oldStatus, status, req.user.id]
      );

      // Emit to customer tracking room
      emitToOrder(id, 'order_status_changed', {
        orderId: id,
        status,
        message: `Your order status changed to ${status}`
      });

      // Emit to specific roles for dashboard updates
      const updateData = { orderId: id, status, tableNumber, updatedOrder };
      emitToRole(USER_ROLES.KITCHEN, 'order_status_updated', updateData);
      emitToRole(USER_ROLES.MANAGER, 'order_status_updated', updateData);
      emitToRole(USER_ROLES.ADMIN, 'order_status_updated', updateData);
      emitToRole(USER_ROLES.STAFF, 'order_status_updated', updateData);
      emitToRole(USER_ROLES.CASHIER, 'order_status_updated', updateData);
    }

    await pool.query('COMMIT');

    res.json({ message: 'Order updated', order: updatedOrder });
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

