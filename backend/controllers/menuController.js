import pool from '../config/database.js';

// Get all menus
export const getMenus = async (req, res, next) => {
  try {
    const { include_foods = 'false' } = req.query;

    const result = await pool.query(
      'SELECT * FROM menus WHERE is_active = true ORDER BY display_order, name'
    );

    const menus = result.rows;

    if (include_foods === 'true') {
      for (const menu of menus) {
        const foodsResult = await pool.query(
          'SELECT * FROM foods WHERE menu_id = $1 AND is_available = true ORDER BY display_order, name',
          [menu.id]
        );
        menu.foods = foodsResult.rows;
      }
    }

    res.json({ menus, count: menus.length });
  } catch (error) {
    next(error);
  }
};

// Get single menu by ID
export const getMenuById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const menuResult = await pool.query('SELECT * FROM menus WHERE id = $1', [id]);

    if (menuResult.rows.length === 0) {
      return res.status(404).json({ error: 'Menu not found' });
    }

    const menu = menuResult.rows[0];

    const foodsResult = await pool.query(
      'SELECT * FROM foods WHERE menu_id = $1 ORDER BY display_order, name',
      [id]
    );
    menu.foods = foodsResult.rows;

    res.json({ menu });
  } catch (error) {
    next(error);
  }
};

// Create menu (Admin only)
export const createMenu = async (req, res, next) => {
  try {
    const { name, description, is_active = true, display_order = 0 } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Menu name is required' });
    }

    const result = await pool.query(
      'INSERT INTO menus (name, description, is_active, display_order) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description || null, is_active, display_order]
    );

    res.status(201).json({ message: 'Menu created successfully', menu: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

// Update menu (Admin only)
export const updateMenu = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, is_active, display_order } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 0;

    if (name !== undefined) {
      paramCount++;
      updates.push(`name = $${paramCount}`);
      values.push(name);
    }
    if (description !== undefined) {
      paramCount++;
      updates.push(`description = $${paramCount}`);
      values.push(description);
    }
    if (is_active !== undefined) {
      paramCount++;
      updates.push(`is_active = $${paramCount}`);
      values.push(is_active);
    }
    if (display_order !== undefined) {
      paramCount++;
      updates.push(`display_order = $${paramCount}`);
      values.push(display_order);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    paramCount++;
    values.push(id);

    const result = await pool.query(
      `UPDATE menus SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Menu not found' });
    }

    res.json({ message: 'Menu updated successfully', menu: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

// Delete menu (Admin only)
export const deleteMenu = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM menus WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Menu not found' });
    }

    res.json({ message: 'Menu deleted successfully' });
  } catch (error) {
    next(error);
  }
};

