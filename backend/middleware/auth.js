import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');

    if (!authHeader) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    // Handle Guest Sessions
    if (authHeader.startsWith('Guest ')) {
      const sessionToken = authHeader.replace('Guest ', '');
      const guestResult = await pool.query(
        `SELECT gs.*, rt.table_number 
         FROM guest_sessions gs 
         LEFT JOIN restaurant_tables rt ON gs.table_id = rt.id 
         WHERE gs.session_token = $1 AND gs.expires_at > CURRENT_TIMESTAMP`,
        [sessionToken]
      );

      if (guestResult.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid or expired guest session.' });
      }

      const guest = guestResult.rows[0];
      req.user = {
        id: guest.id,
        isGuest: true,
        role: 'customer',
        full_name: guest.guest_name || `Guest @ Table ${guest.table_number || '?'}`,
        table_id: guest.table_id,
        table_number: guest.table_number
      };
      return next();
    }

    // Handle Registered Users (JWT)
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const result = await pool.query(
      'SELECT id, email, full_name, role, branch_id FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid token. User not found.' });
    }

    req.user = result.rows[0];
    req.user.isGuest = false;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') return res.status(401).json({ error: 'Invalid token.' });
    if (error.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expired.' });
    console.error('Auth Middleware Error:', error);
    res.status(500).json({ error: 'Authentication error.' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }

    next();
  };
};

