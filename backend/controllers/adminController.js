import pool from '../config/database.js';
import bcrypt from 'bcryptjs';
import { USER_ROLES } from '../utils/constants.js';

// User & Role Management

// Get all users
export const getAllUsers = async (req, res, next) => {
    try {
        const result = await pool.query(
            'SELECT id, email, full_name, role, phone, is_active, created_at, last_login FROM users ORDER BY created_at DESC'
        );
        res.json({ users: result.rows });
    } catch (error) {
        next(error);
    }
};

// Create a new user
export const createUser = async (req, res, next) => {
    try {
        const { email, password, full_name, role, phone } = req.body;

        if (!email || !password || !full_name || !role) {
            return res.status(400).json({ error: 'All fields are required except phone' });
        }

        if (!Object.values(USER_ROLES).includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        // Check if user exists
        const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ error: 'User with this email already exists' });
        }

        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        const result = await pool.query(
            'INSERT INTO users (email, password_hash, full_name, role, phone, is_active) VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING id, email, full_name, role, phone, is_active, created_at',
            [email, password_hash, full_name, role, phone || null]
        );

        res.status(201).json({
            message: 'User created successfully',
            user: result.rows[0],
        });
    } catch (error) {
        next(error);
    }
};

// Update user details
export const updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { full_name, role, phone, email } = req.body;

        // Check if role is valid
        if (role && !Object.values(USER_ROLES).includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        const result = await pool.query(
            'UPDATE users SET full_name = COALESCE($1, full_name), role = COALESCE($2, role), phone = COALESCE($3, phone), email = COALESCE($4, email), updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING id, email, full_name, role, phone, is_active, updated_at',
            [full_name, role, phone, email, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            message: 'User updated successfully',
            user: result.rows[0],
        });
    } catch (error) {
        next(error);
    }
};

// Activate/Deactivate user
export const setUserStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;

        if (typeof is_active !== 'boolean') {
            return res.status(400).json({ error: 'is_active must be a boolean' });
        }

        const result = await pool.query(
            'UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, email, is_active',
            [is_active, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            message: `User ${is_active ? 'activated' : 'deactivated'} successfully`,
            user: result.rows[0],
        });
    } catch (error) {
        next(error);
    }
};

// Reset user password
export const resetUserPassword = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ error: 'New password is required' });
        }

        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        const result = await pool.query(
            'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, email',
            [password_hash, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            message: 'Password reset successfully',
        });
    } catch (error) {
        next(error);
    }
};

// Delete user (Optional, but often requested)
export const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        next(error);
    }
};
