import pool from '../config/database.js';

// Get all branches
export const getBranches = async (req, res, next) => {
    try {
        const result = await pool.query('SELECT * FROM branches ORDER BY created_at DESC');
        res.json({ branches: result.rows });
    } catch (error) {
        next(error);
    }
};

// Create a new branch
export const createBranch = async (req, res, next) => {
    try {
        const { name, address, city, country, phone, email, timezone, currency } = req.body;

        const result = await pool.query(
            `INSERT INTO branches (name, address, city, country, phone, email, timezone, currency)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [name, address, city, country, phone, email, timezone || 'UTC', currency || 'USD']
        );

        res.status(201).json({ message: 'Branch created successfully', branch: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

// Update branch details
export const updateBranch = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, address, city, country, phone, email, timezone, currency, is_active } = req.body;

        const result = await pool.query(
            `UPDATE branches 
             SET name = COALESCE($1, name), address = COALESCE($2, address), city = COALESCE($3, city), 
                 country = COALESCE($4, country), phone = COALESCE($5, phone), email = COALESCE($6, email), 
                 timezone = COALESCE($7, timezone), currency = COALESCE($8, currency), 
                 is_active = COALESCE($9, is_active), updated_at = CURRENT_TIMESTAMP
             WHERE id = $10 RETURNING *`,
            [name, address, city, country, phone, email, timezone, currency, is_active, id]
        );

        if (result.rows.length === 0) return res.status(404).json({ error: 'Branch not found' });

        res.json({ message: 'Branch updated successfully', branch: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

// Delete a branch
export const deleteBranch = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM branches WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) return res.status(404).json({ error: 'Branch not found' });

        res.json({ message: 'Branch deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// Branch-wise performance
export const getBranchPerformance = async (req, res, next) => {
    try {
        const result = await pool.query(`
            SELECT 
                b.id, b.name,
                COUNT(o.id) as total_orders,
                COALESCE(SUM(o.total_amount), 0) as total_revenue,
                COALESCE(AVG(o.total_amount), 0) as avg_order_value
            FROM branches b
            LEFT JOIN orders o ON o.branch_id = b.id
            GROUP BY b.id, b.name
        `);
        res.json({ performance: result.rows });
    } catch (error) {
        next(error);
    }
};

