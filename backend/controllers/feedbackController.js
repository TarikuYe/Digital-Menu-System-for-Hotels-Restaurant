import pool from '../config/database.js';

// Submit feedback (Customer)
export const createFeedback = async (req, res, next) => {
  try {
    const { food_id, order_id, rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Verify food exists if provided
    if (food_id) {
      const foodResult = await pool.query('SELECT id FROM foods WHERE id = $1', [food_id]);
      if (foodResult.rows.length === 0) {
        return res.status(404).json({ error: 'Food not found' });
      }
    }

    // Verify order exists if provided
    if (order_id) {
      const orderResult = await pool.query('SELECT id FROM orders WHERE id = $1', [order_id]);
      if (orderResult.rows.length === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }
    }

    const result = await pool.query(
      `INSERT INTO feedback (user_id, food_id, order_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        req.user.id,
        food_id || null,
        order_id || null,
        rating,
        comment || null,
      ]
    );

    const feedback = result.rows[0];

    // Get related food name if food_id provided
    if (food_id) {
      const foodResult = await pool.query('SELECT name FROM foods WHERE id = $1', [food_id]);
      if (foodResult.rows.length > 0) {
        feedback.food_name = foodResult.rows[0].name;
      }
    }

    res.status(201).json({ message: 'Feedback submitted successfully', feedback });
  } catch (error) {
    next(error);
  }
};

// Get feedback (Admin/Staff can see all, Customer sees own)
export const getFeedback = async (req, res, next) => {
  try {
    const { food_id, user_id, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT 
        f.*,
        u.full_name as user_name,
        u.email as user_email,
        fo.name as food_name
      FROM feedback f
      LEFT JOIN users u ON f.user_id = u.id
      LEFT JOIN foods fo ON f.food_id = fo.id
      WHERE f.is_visible = true
    `;
    const params = [];
    let paramCount = 0;

    // Filter by user if customer
    if (req.user.role === 'customer') {
      paramCount++;
      query += ` AND f.user_id = $${paramCount}`;
      params.push(req.user.id);
    } else if (user_id) {
      paramCount++;
      query += ` AND f.user_id = $${paramCount}`;
      params.push(user_id);
    }

    // Filter by food
    if (food_id) {
      paramCount++;
      query += ` AND f.food_id = $${paramCount}`;
      params.push(food_id);
    }

    query += ` ORDER BY f.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    res.json({ feedback: result.rows, count: result.rows.length });
  } catch (error) {
    next(error);
  }
};

// Get single feedback by ID
export const getFeedbackById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        f.*,
        u.full_name as user_name,
        u.email as user_email,
        fo.name as food_name
      FROM feedback f
      LEFT JOIN users u ON f.user_id = u.id
      LEFT JOIN foods fo ON f.food_id = fo.id
      WHERE f.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    const feedback = result.rows[0];

    // Check authorization
    if (req.user.role === 'customer' && feedback.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ feedback });
  } catch (error) {
    next(error);
  }
};

// Update feedback visibility (Admin)
export const updateFeedbackVisibility = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_visible } = req.body;

    if (typeof is_visible !== 'boolean') {
      return res.status(400).json({ error: 'is_visible must be a boolean' });
    }

    const result = await pool.query(
      'UPDATE feedback SET is_visible = $1 WHERE id = $2 RETURNING *',
      [is_visible, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    res.json({ message: 'Feedback visibility updated', feedback: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

