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
    const { food_id, user_id, start_date, end_date, sentiment, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT 
        f.*,
        u.full_name as user_name,
        u.email as user_email,
        fo.name as food_name
      FROM feedback f
      LEFT JOIN users u ON f.user_id = u.id
      LEFT JOIN foods fo ON f.food_id = fo.id
      WHERE 1=1
    `;
    const params = [];

    // Filter by visibility for customers
    if (req.user.role === 'customer') {
      query += ` AND f.is_visible = true AND f.user_id = $${params.length + 1}`;
      params.push(req.user.id);
    } else if (user_id) {
      query += ` AND f.user_id = $${params.length + 1}`;
      params.push(user_id);
    }

    // Filter by food
    if (food_id) {
      query += ` AND f.food_id = $${params.length + 1}`;
      params.push(food_id);
    }

    // Filter by date
    if (start_date) {
      query += ` AND f.created_at >= $${params.length + 1}`;
      params.push(start_date);
    }
    if (end_date) {
      query += ` AND f.created_at <= $${params.length + 1}`;
      params.push(end_date);
    }

    // Filter by sentiment
    if (sentiment) {
      query += ` AND f.sentiment_label = $${params.length + 1}`;
      params.push(sentiment);
    }

    query += ` ORDER BY f.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
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

// Respond to feedback (Admin)
export const respondToFeedback = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { response } = req.body;

    const result = await pool.query(
      'UPDATE feedback SET admin_response = $1, admin_id = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [response, req.user.id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    res.json({ message: 'Response added successfully', feedback: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

// Simulated AI Sentiment Analysis
const analyzeTextSentiment = (text) => {
  if (!text) return { score: 0, label: 'neutral' };

  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'delicious', 'tasty', 'wonderful', 'perfect', 'love', 'best'];
  const negativeWords = ['bad', 'poor', 'terrible', 'awful', 'cold', 'salty', 'late', 'rude', 'disappointing', 'worst', 'failed'];

  const words = text.toLowerCase().split(/\s+/);
  let score = 0;

  words.forEach(word => {
    if (positiveWords.includes(word)) score += 0.2;
    if (negativeWords.includes(word)) score -= 0.2;
  });

  // Normalize score between -1 and 1
  score = Math.max(-1, Math.min(1, score));

  let label = 'neutral';
  if (score > 0.1) label = 'positive';
  if (score < -0.1) label = 'negative';

  return { score: parseFloat(score.toFixed(2)), label };
};

export const runSentimentAnalysis = async (req, res, next) => {
  try {
    const { id } = req.params;

    const feedbackRes = await pool.query('SELECT comment FROM feedback WHERE id = $1', [id]);
    if (feedbackRes.rows.length === 0) return res.status(404).json({ error: 'Feedback not found' });

    const comment = feedbackRes.rows[0].comment;
    const { score, label } = analyzeTextSentiment(comment);

    const result = await pool.query(
      'UPDATE feedback SET sentiment_score = $1, sentiment_label = $2, sentiment_analyzed_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [score, label, id]
    );

    res.json({ message: 'Sentiment analyzed', feedback: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

// Bulk Analyze Sentiment
export const bulkAnalyzeSentiment = async (req, res, next) => {
  try {
    const feedbacks = await pool.query('SELECT id, comment FROM feedback WHERE sentiment_label IS NULL AND comment IS NOT NULL');
    const results = [];

    for (const f of feedbacks.rows) {
      const { score, label } = analyzeTextSentiment(f.comment);
      const update = await pool.query(
        'UPDATE feedback SET sentiment_score = $1, sentiment_label = $2, sentiment_analyzed_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
        [score, label, f.id]
      );
      results.push(update.rows[0]);
    }

    res.json({ message: `Analyzed ${results.length} records`, results });
  } catch (error) {
    next(error);
  }
};

export const getInsights = async (req, res, next) => {
  try {
    // Foods needing improvement (Negative sentiment count > 3)
    const improvementQuery = `
      SELECT f.name, COUNT(*) as negative_count
      FROM feedback fb
      JOIN foods f ON fb.food_id = f.id
      WHERE fb.sentiment_label = 'negative'
      GROUP BY f.id, f.name
      HAVING COUNT(*) >= 1
      ORDER BY negative_count DESC
    `;
    const improvements = await pool.query(improvementQuery);

    // Detection patterns (Keywords most used in negative feedback)
    const negativeComments = await pool.query("SELECT comment FROM feedback WHERE sentiment_label = 'negative'");
    const wordFreq = {};
    negativeComments.rows.forEach(row => {
      const words = row.comment.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
      words.forEach(word => {
        if (word.length > 3) wordFreq[word] = (wordFreq[word] || 0) + 1;
      });
    });
    const patterns = Object.entries(wordFreq).sort((a, b) => b[1] - a[1]).slice(0, 5);

    res.json({
      needingImprovement: improvements.rows,
      commonComplaints: patterns
    });
  } catch (error) {
    next(error);
  }
};


