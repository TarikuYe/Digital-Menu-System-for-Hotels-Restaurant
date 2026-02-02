import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../config/database.js';
import { USER_ROLES } from '../utils/constants.js';

// Register new user
export const register = async (req, res, next) => {
  try {
    const { email, password, full_name, role = 'customer', phone } = req.body;

    // Validation
    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Email, password, and full name are required' });
    }

    if (!Object.values(USER_ROLES).includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Check if user exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, full_name, role, phone) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, full_name, role, phone, branch_id, created_at',
      [email, password_hash, full_name, role, phone || null]
    );

    const user = result.rows[0];

    // Generate JWT token
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET is not set in environment variables');
      return res.status(500).json({ error: 'Server configuration error. Please contact administrator.' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        phone: user.phone,
        branch_id: user.branch_id
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    if (error.code) {
      console.error('Database error code:', error.code);
    }
    next(error);
  }
};

// Login user
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const result = await pool.query(
      'SELECT id, email, password_hash, full_name, role, phone, is_active, status, branch_id FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Check if account is active
    if (user.is_active === false) {
      return res.status(403).json({ error: 'Your account has been deactivated. Please contact an administrator.' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }


    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        phone: user.phone,
        branch_id: user.branch_id
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get current user
export const getMe = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, email, full_name, role, phone, created_at, status, branch_id FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    next(error);
  }
};
// Create Guest Session
export const createGuestSession = async (req, res, next) => {
  try {
    const { table_number, guest_name } = req.body;

    const tableResult = await pool.query('SELECT id FROM restaurant_tables WHERE table_number = $1', [table_number]);
    if (tableResult.rows.length === 0) return res.status(404).json({ error: 'Table not found' });

    const tableId = tableResult.rows[0].id;
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 12);

    const result = await pool.query(
      `INSERT INTO guest_sessions (table_id, session_token, guest_name, expires_at) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [tableId, sessionToken, guest_name || null, expiresAt]
    );

    // Update table status to occupied and notify staff
    const updateResult = await pool.query(
      'UPDATE restaurant_tables SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      ['occupied', tableId]
    );
    const updatedTable = updateResult.rows[0];

    import('../utils/socket.js').then(({ emitToRole }) => {
      const tableData = { table_number, status: 'occupied', id: tableId };
      emitToRole('staff', 'table_status_updated', tableData);
      emitToRole('manager', 'table_status_updated', tableData);
      emitToRole('waiter', 'table_status_updated', tableData);
    });

    res.json({
      token: sessionToken,
      session: result.rows[0],
      table_number
    });
  } catch (error) {
    next(error);
  }
};
// Update User Status
export const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status is required' });

    const result = await pool.query(
      'UPDATE users SET status = $1 WHERE id = $2 RETURNING id, full_name, role, status',
      [status, req.user.id]
    );

    const updatedUser = result.rows[0];

    // Broadcast status change to everyone (or specific roles)
    import('../utils/socket.js').then(({ emitToAll }) => {
      emitToAll('user_status_updated', updatedUser);
    });

    res.json({ message: 'Status updated', user: updatedUser });
  } catch (error) {
    next(error);
  }
};
