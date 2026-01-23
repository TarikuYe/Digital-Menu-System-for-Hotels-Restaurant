import pool from '../config/database.js';
import { DEFAULT_LANGUAGE } from '../utils/constants.js';

// Get all foods with optional filters
export const getFoods = async (req, res, next) => {
  try {
    const { menu_id, is_available, is_vegetarian, is_vegan, is_gluten_free, language = DEFAULT_LANGUAGE } = req.query;

    let query = `
      SELECT 
        f.id,
        f.menu_id,
        m.name as menu_name,
        f.name,
        f.description,
        f.price,
        f.image_url,
        f.spice_level,
        f.preparation_time,
        f.is_available,
        f.is_vegetarian,
        f.is_vegan,
        f.is_gluten_free,
        f.calories,
        f.display_order,
        f.created_at
      FROM foods f
      LEFT JOIN menus m ON f.menu_id = m.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (menu_id) {
      paramCount++;
      query += ` AND f.menu_id = $${paramCount}`;
      params.push(menu_id);
    }

    if (is_available !== undefined) {
      paramCount++;
      query += ` AND f.is_available = $${paramCount}`;
      params.push(is_available === 'true');
    }

    if (is_vegetarian === 'true') {
      paramCount++;
      query += ` AND f.is_vegetarian = $${paramCount}`;
      params.push(true);
    }

    if (is_vegan === 'true') {
      paramCount++;
      query += ` AND f.is_vegan = $${paramCount}`;
      params.push(true);
    }

    if (is_gluten_free === 'true') {
      paramCount++;
      query += ` AND f.is_gluten_free = $${paramCount}`;
      params.push(true);
    }

    query += ` ORDER BY f.display_order, f.name`;

    const result = await pool.query(query, params);
    const foods = result.rows;

    // Get translations if language is not default
    if (language !== DEFAULT_LANGUAGE) {
      const langResult = await pool.query('SELECT id FROM languages WHERE code = $1', [language]);
      if (langResult.rows.length > 0) {
        const langId = langResult.rows[0].id;
        const foodIds = foods.map(f => f.id);
        
        if (foodIds.length > 0) {
          const translationsResult = await pool.query(
            'SELECT food_id, name, description FROM food_translations WHERE food_id = ANY($1) AND language_id = $2',
            [foodIds, langId]
          );
          
          const translationsMap = {};
          translationsResult.rows.forEach(t => {
            translationsMap[t.food_id] = t;
          });

          foods.forEach(food => {
            if (translationsMap[food.id]) {
              food.name = translationsMap[food.id].name;
              food.description = translationsMap[food.id].description || food.description;
            }
          });
        }
      }
    }

    // Get ingredients for each food
    for (const food of foods) {
      const ingredientsResult = await pool.query(
        `SELECT i.id, i.name, i.allergen_type 
         FROM ingredients i
         INNER JOIN food_ingredients fi ON i.id = fi.ingredient_id
         WHERE fi.food_id = $1
         ORDER BY i.name`,
        [food.id]
      );
      food.ingredients = ingredientsResult.rows;
    }

    res.json({ foods, count: foods.length });
  } catch (error) {
    next(error);
  }
};

// Get single food by ID
export const getFoodById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { language = DEFAULT_LANGUAGE } = req.query;

    const result = await pool.query(
      `SELECT 
        f.*,
        m.name as menu_name
       FROM foods f
       LEFT JOIN menus m ON f.menu_id = m.id
       WHERE f.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Food not found' });
    }

    let food = result.rows[0];

    // Get translation if language is not default
    if (language !== DEFAULT_LANGUAGE) {
      const langResult = await pool.query('SELECT id FROM languages WHERE code = $1', [language]);
      if (langResult.rows.length > 0) {
        const translationResult = await pool.query(
          'SELECT name, description FROM food_translations WHERE food_id = $1 AND language_id = $2',
          [id, langResult.rows[0].id]
        );
        if (translationResult.rows.length > 0) {
          food.name = translationResult.rows[0].name;
          food.description = translationResult.rows[0].description || food.description;
        }
      }
    }

    // Get ingredients
    const ingredientsResult = await pool.query(
      `SELECT i.id, i.name, i.allergen_type 
       FROM ingredients i
       INNER JOIN food_ingredients fi ON i.id = fi.ingredient_id
       WHERE fi.food_id = $1
       ORDER BY i.name`,
      [id]
    );
    food.ingredients = ingredientsResult.rows;

    res.json({ food });
  } catch (error) {
    next(error);
  }
};

// Create food (Admin only)
export const createFood = async (req, res, next) => {
  try {
    const {
      menu_id,
      name,
      description,
      price,
      image_url,
      spice_level = 0,
      preparation_time,
      is_vegetarian = false,
      is_vegan = false,
      is_gluten_free = false,
      calories,
      display_order = 0,
      ingredient_ids = [],
    } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    const result = await pool.query(
      `INSERT INTO foods (
        menu_id, name, description, price, image_url, spice_level, 
        preparation_time, is_vegetarian, is_vegan, is_gluten_free, 
        calories, display_order
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        menu_id || null,
        name,
        description || null,
        price,
        image_url || null,
        spice_level,
        preparation_time || null,
        is_vegetarian,
        is_vegan,
        is_gluten_free,
        calories || null,
        display_order,
      ]
    );

    const food = result.rows[0];

    // Add ingredients
    if (ingredient_ids.length > 0) {
      for (const ingredientId of ingredient_ids) {
        await pool.query(
          'INSERT INTO food_ingredients (food_id, ingredient_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [food.id, ingredientId]
        );
      }
    }

    res.status(201).json({ message: 'Food created successfully', food });
  } catch (error) {
    next(error);
  }
};

// Update food (Admin only)
export const updateFood = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;
    const allowedFields = [
      'menu_id', 'name', 'description', 'price', 'image_url', 'spice_level',
      'preparation_time', 'is_available', 'is_vegetarian', 'is_vegan',
      'is_gluten_free', 'calories', 'display_order'
    ];

    const updates = [];
    const values = [];
    let paramCount = 0;

    for (const field of allowedFields) {
      if (updateFields[field] !== undefined) {
        paramCount++;
        updates.push(`${field} = $${paramCount}`);
        values.push(updateFields[field]);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    paramCount++;
    values.push(id);

    const result = await pool.query(
      `UPDATE foods SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Food not found' });
    }

    // Update ingredients if provided
    if (updateFields.ingredient_ids) {
      // Remove existing ingredients
      await pool.query('DELETE FROM food_ingredients WHERE food_id = $1', [id]);
      
      // Add new ingredients
      if (updateFields.ingredient_ids.length > 0) {
        for (const ingredientId of updateFields.ingredient_ids) {
          await pool.query(
            'INSERT INTO food_ingredients (food_id, ingredient_id) VALUES ($1, $2)',
            [id, ingredientId]
          );
        }
      }
    }

    res.json({ message: 'Food updated successfully', food: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

// Delete food (Admin only)
export const deleteFood = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM foods WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Food not found' });
    }

    res.json({ message: 'Food deleted successfully' });
  } catch (error) {
    next(error);
  }
};

