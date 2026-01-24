
import pool from '../config/database.js';

// Get all tables with current status and active session info
export const getTables = async (req, res, next) => {
    try {
        const result = await pool.query(`
      SELECT 
        rt.*,
        gs.id as active_session_id,
        gs.guest_name,
        (SELECT COUNT(*) FROM orders o WHERE o.table_id = rt.id AND o.status NOT IN ('served', 'cancelled', 'paid')) as active_orders_count
      FROM restaurant_tables rt
      LEFT JOIN guest_sessions gs ON rt.id = gs.table_id AND gs.expires_at > CURRENT_TIMESTAMP
      ORDER BY rt.table_number
    `);

        res.json({ tables: result.rows });
    } catch (error) {
        next(error);
    }
};

// Update table status (e.g., mark as dirty, available)
export const updateTableStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['available', 'occupied', 'dirty', 'reserved'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const result = await pool.query(
            'UPDATE restaurant_tables SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Table not found' });
        }

        res.json({ message: 'Table status updated', table: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

// Get specific table details
export const getTableById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM restaurant_tables WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Table not found' });
        }

        res.json({ table: result.rows[0] });
    } catch (error) {
        next(error);
    }
};
// Create a new table
export const createTable = async (req, res, next) => {
    try {
        const { table_number, capacity, region_name } = req.body;

        const result = await pool.query(
            'INSERT INTO restaurant_tables (table_number, capacity, region_name, status) VALUES ($1, $2, $3, \'available\') RETURNING *',
            [table_number, capacity || 4, region_name || 'Main Hall']
        );

        res.status(201).json({ message: 'Table created', table: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

// Update table configuration
export const updateTable = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { table_number, capacity, region_name } = req.body;

        const result = await pool.query(
            'UPDATE restaurant_tables SET table_number = COALESCE($1, table_number), capacity = COALESCE($2, capacity), region_name = COALESCE($3, region_name), updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
            [table_number, capacity, region_name, id]
        );

        if (result.rows.length === 0) return res.status(404).json({ error: 'Table not found' });

        res.json({ message: 'Table updated', table: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

// Delete a table
export const deleteTable = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM restaurant_tables WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) return res.status(404).json({ error: 'Table not found' });

        res.json({ message: 'Table deleted successfully' });
    } catch (error) {
        next(error);
    }
};
