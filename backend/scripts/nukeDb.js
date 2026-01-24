
import pool from '../config/database.js';

async function nukeAndRebuild() {
    console.log('Nuking Menus/Foods and rebuilding...');

    try {
        await pool.query('DROP TABLE IF EXISTS order_items CASCADE');
        await pool.query('DROP TABLE IF EXISTS orders CASCADE');
        await pool.query('DROP TABLE IF EXISTS food_ingredients CASCADE');
        await pool.query('DROP TABLE IF EXISTS food_translations CASCADE');
        await pool.query('DROP TABLE IF EXISTS feedback CASCADE');
        await pool.query('DROP TABLE IF EXISTS foods CASCADE');
        await pool.query('DROP TABLE IF EXISTS menus CASCADE');
        console.log('✅ Dropped tables');

        // Recreate Menus
        await pool.query(`
        CREATE TABLE menus (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(255) NOT NULL UNIQUE,
            description TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            display_order INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
        console.log('✅ Created Menus');

        // Recreate Foods
        await pool.query(`
        CREATE TABLE foods (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            menu_id UUID REFERENCES menus(id) ON DELETE SET NULL,
            name VARCHAR(255) NOT NULL UNIQUE,
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
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
        console.log('✅ Created Foods');

        // Orders (Simplified for recovery)
        await pool.query(`
        CREATE TABLE IF NOT EXISTS orders (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES users(id) ON DELETE SET NULL,
            table_number VARCHAR(20),
            status VARCHAR(20) NOT NULL DEFAULT 'pending',
            total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
            special_instructions TEXT,
            guest_session_id UUID REFERENCES guest_sessions(id),
            table_id UUID REFERENCES restaurant_tables(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
        await pool.query(`
         CREATE TABLE IF NOT EXISTS order_items (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
            food_id UUID REFERENCES foods(id) ON DELETE SET NULL,
            quantity INTEGER NOT NULL CHECK (quantity > 0),
            unit_price DECIMAL(10, 2) NOT NULL,
            subtotal DECIMAL(10, 2) NOT NULL,
            special_instructions TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
        console.log('✅ Created Orders');

        // SEED
        await pool.query("INSERT INTO menus (name) VALUES ('Main Course')");
        const menuRes = await pool.query("SELECT id FROM menus LIMIT 1");
        const menuId = menuRes.rows[0].id;

        await pool.query(`
            INSERT INTO foods (name, price, menu_id, is_available) 
            VALUES ('Emergency Burger', 5.00, $1, true)
      `, [menuId]);
        console.log('✅ Seeded Data');

        process.exit(0);
    } catch (err) {
        console.error('Nuke Failed:', err);
        process.exit(1);
    }
}

nukeAndRebuild();
