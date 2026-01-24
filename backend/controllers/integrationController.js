import pool from '../config/database.js';
import crypto from 'crypto';

export const getApiKeys = async (req, res, next) => {
    try {
        const result = await pool.query(
            'SELECT id, key_name, permissions, is_active, last_used_at, expires_at, created_at FROM api_keys WHERE user_id = $1 ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json({ keys: result.rows });
    } catch (error) {
        next(error);
    }
};

export const createApiKey = async (req, res, next) => {
    try {
        const { key_name, permissions, expires_in_days } = req.body;

        // Generate a random secure key
        const rawKey = crypto.randomBytes(32).toString('hex');
        const prefix = 'dm_'; // Digital Menu prefix
        const fullKey = prefix + rawKey;

        const expiresAt = expires_in_days ? new Date(Date.now() + expires_in_days * 24 * 60 * 60 * 1000) : null;

        const result = await pool.query(
            `INSERT INTO api_keys (key_name, key_value, user_id, permissions, expires_at)
             VALUES ($1, $2, $3, $4, $5) RETURNING id, key_name, permissions, created_at`,
            [key_name, fullKey, req.user.id, JSON.stringify(permissions || { read: true, write: false }), expiresAt]
        );

        // We return the raw key only ONCE at creation
        res.status(201).json({
            message: 'API Key created successfully. Please save it securely as it will not be shown again.',
            key: fullKey,
            keyInfo: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

export const deleteApiKey = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM api_keys WHERE id = $1 AND user_id = $2 RETURNING id', [id, req.user.id]);

        if (result.rows.length === 0) return res.status(404).json({ error: 'API Key not found' });

        res.json({ message: 'API Key revoked successfully' });
    } catch (error) {
        next(error);
    }
};

export const toggleApiKeyStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;

        const result = await pool.query(
            'UPDATE api_keys SET is_active = $1 WHERE id = $2 AND user_id = $3 RETURNING id, is_active',
            [is_active, id, req.user.id]
        );

        if (result.rows.length === 0) return res.status(404).json({ error: 'API Key not found' });

        res.json({ message: `API Key ${is_active ? 'enabled' : 'disabled'}`, key: result.rows[0] });
    } catch (error) {
        next(error);
    }
};
