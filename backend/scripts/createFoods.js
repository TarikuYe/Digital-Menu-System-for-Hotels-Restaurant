
import pool from '../config/database.js';

async function createFoods() {
    console.log('Creating foods table...');
    try {
        // Check menus first
        const menuCheck = await pool.query("SELECT id FROM menus LIMIT 1");
        console.log('Menu check:', menuCheck.rows.length);

        await pool.query(`
        CREATE TABLE IF NOT EXISTS foods (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            menu_id UUID REFERENCES menus(id) ON DELETE SET NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
            image_url VARCHAR(500),
            spice_level INTEGER DEFAULT 0 CHECK (spice_level >= 0 AND spice_level <= 5),
            preparation_time INTEGER,
            is_available BOOLEAN DEFAULT TRUE,
            is_vegetarian BOOLEAN DEFAULT FALSE,
            is_vegan BOOLEAN DEFAULT FALSE,
            is_gluten_free BOOLEAN DEFAULT FALSE,
            calories INTEGER,
            display_order INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(name)
        );
      `);
        console.log('✅ Created foods table');

        // Seed one food
        const menuRes = await pool.query("SELECT id FROM menus LIMIT 1");
        if (menuRes.rows.length > 0) {
            await pool.query(`
            INSERT INTO foods (name, price, menu_id, is_available) 
            VALUES ('Emergency Burger', 5.00, $1, true)
            ON CONFLICT (name) DO NOTHING
          `, [menuRes.rows[0].id]);
            console.log('✅ Seeded Emergency Burger');
        }

        process.exit(0);
    } catch (err) {
        console.error('Failed:', err);
        process.exit(1);
    }
}

createFoods();
