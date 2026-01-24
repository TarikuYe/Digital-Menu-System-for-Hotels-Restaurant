import pool from '../config/database.js';

// Get all system settings
export const getSystemSettings = async (req, res, next) => {
    try {
        const result = await pool.query('SELECT * FROM system_settings ORDER BY setting_key');

        // Transform to a cleaner object for the frontend
        const settings = {};
        result.rows.forEach(row => {
            settings[row.setting_key] = {
                value: row.setting_value,
                type: row.setting_type,
                description: row.description,
                is_public: row.is_public
            };
        });

        res.json({ settings });
    } catch (error) {
        next(error);
    }
};

// Update or create multiple settings
export const updateSystemSettings = async (req, res, next) => {
    try {
        const { settings } = req.body; // Map: { key: value }

        if (!settings || typeof settings !== 'object') {
            return res.status(400).json({ error: 'Settings object is required' });
        }

        await pool.query('BEGIN');

        for (const [key, value] of Object.entries(settings)) {
            await pool.query(
                `INSERT INTO system_settings (setting_key, setting_value, updated_by)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (setting_key) 
                 DO UPDATE SET setting_value = $2, updated_at = CURRENT_TIMESTAMP, updated_by = $3`,
                [key, value.toString(), req.user.id]
            );
        }

        await pool.query('COMMIT');
        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        await pool.query('ROLLBACK');
        next(error);
    }
};

// Get branch/restaurant profile
export const getRestaurantProfile = async (req, res, next) => {
    try {
        // We use the first branch as the primary restaurant for now
        const result = await pool.query('SELECT * FROM branches WHERE is_active = TRUE LIMIT 1');
        res.json({ profile: result.rows[0] || null });
    } catch (error) {
        next(error);
    }
};

// Update restaurant profile
export const updateRestaurantProfile = async (req, res, next) => {
    try {
        const { name, address, city, country, phone, email, currency } = req.body;

        // Find existing main branch or create one
        let result = await pool.query('SELECT id FROM branches WHERE is_active = TRUE LIMIT 1');

        if (result.rows.length > 0) {
            const id = result.rows[0].id;
            result = await pool.query(
                `UPDATE branches 
                 SET name = $1, address = $2, city = $3, country = $4, phone = $5, email = $6, currency = $7, updated_at = CURRENT_TIMESTAMP
                 WHERE id = $8 RETURNING *`,
                [name, address, city, country, phone, email, currency, id]
            );
        } else {
            result = await pool.query(
                `INSERT INTO branches (name, address, city, country, phone, email, currency)
                 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
                [name, address, city, country, phone, email, currency]
            );
        }

        res.json({ message: 'Profile updated successfully', profile: result.rows[0] });
    } catch (error) {
        next(error);
    }
};
