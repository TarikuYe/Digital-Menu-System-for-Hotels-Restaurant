import pool from '../config/database.js';

// Language Management
export const getLanguages = async (req, res, next) => {
    try {
        const result = await pool.query('SELECT * FROM languages ORDER BY name ASC');
        res.json({ languages: result.rows });
    } catch (error) {
        next(error);
    }
};

export const createLanguage = async (req, res, next) => {
    try {
        const { code, name, is_default } = req.body;
        if (!code || !name) return res.status(400).json({ error: 'Code and name are required' });

        // If setting as default, unset others first
        if (is_default) {
            await pool.query('UPDATE languages SET is_default = FALSE');
        }

        const result = await pool.query(
            'INSERT INTO languages (code, name, is_default) VALUES ($1, $2, $3) RETURNING *',
            [code.toLowerCase(), name, !!is_default]
        );
        res.status(201).json({ language: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

export const updateLanguage = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { code, name, is_default } = req.body;

        if (is_default) {
            await pool.query('UPDATE languages SET is_default = FALSE');
        }

        const result = await pool.query(
            'UPDATE languages SET code = COALESCE($1, code), name = COALESCE($2, name), is_default = COALESCE($3, is_default) WHERE id = $4 RETURNING *',
            [code?.toLowerCase(), name, is_default, id]
        );

        if (result.rows.length === 0) return res.status(404).json({ error: 'Language not found' });
        res.json({ language: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

export const deleteLanguage = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM languages WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Language not found' });
        res.json({ message: 'Language deleted' });
    } catch (error) {
        next(error);
    }
};

// Translation Management
export const getTranslations = async (req, res, next) => {
    try {
        const { language_id } = req.query;
        if (!language_id) return res.status(400).json({ error: 'language_id is required' });

        const result = await pool.query(
            'SELECT f.id as food_id, f.name as original_name, ft.name as translated_name, ft.description as translated_description FROM foods f LEFT JOIN food_translations ft ON f.id = ft.food_id AND ft.language_id = $1',
            [language_id]
        );
        res.json({ translations: result.rows });
    } catch (error) {
        next(error);
    }
};

export const upsertTranslation = async (req, res, next) => {
    try {
        const { food_id, language_id, name, description } = req.body;
        if (!food_id || !language_id || !name) {
            return res.status(400).json({ error: 'food_id, language_id, and name are required' });
        }

        const result = await pool.query(
            `INSERT INTO food_translations (food_id, language_id, name, description) 
             VALUES ($1, $2, $3, $4) 
             ON CONFLICT (food_id, language_id) 
             DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, updated_at = CURRENT_TIMESTAMP 
             RETURNING *`,
            [food_id, language_id, name, description]
        );

        res.json({ translation: result.rows[0] });
    } catch (error) {
        next(error);
    }
};
