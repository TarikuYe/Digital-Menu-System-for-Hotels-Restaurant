
import pool from '../config/database.js';

async function fixDb() {
    console.log('Fixing database tables (Robust)...');

    try {
        // 0. Tables & Sessions (Pre-requisites for Orders)
        await pool.query(`
        CREATE TABLE IF NOT EXISTS restaurant_tables (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            table_number VARCHAR(10) UNIQUE NOT NULL,
            capacity INTEGER DEFAULT 4,
            status VARCHAR(20) DEFAULT 'available',
            qr_code_token VARCHAR(255) UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
        console.log('✅ Checked/Created table: restaurant_tables');

        await pool.query(`
        CREATE TABLE IF NOT EXISTS guest_sessions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            table_id UUID REFERENCES restaurant_tables(id) ON DELETE CASCADE,
            session_token VARCHAR(255) UNIQUE NOT NULL,
            guest_name VARCHAR(255),
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
        console.log('✅ Checked/Created table: guest_sessions');

        // 1. Menus
        await pool.query(`
        CREATE TABLE IF NOT EXISTS menus (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(255) NOT NULL UNIQUE,
            description TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            display_order INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
        console.log('✅ Checked/Created table: menus');

        // 2. Foods
        await pool.query(`
        CREATE TABLE IF NOT EXISTS foods (
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
        console.log('✅ Checked/Created table: foods');

        // 3. Orders & Items
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
        console.log('✅ Checked/Created tables: orders, order_items');

        // --- SEEDING ---

        // Need Tables for guest test
        await pool.query(`INSERT INTO restaurant_tables (table_number, qr_code_token) VALUES 
         ('1', 'table_1_tkn_2024') ON CONFLICT DO NOTHING`);

        const categories = ['Appetizers', 'Main Course', 'Desserts', 'Drinks'];
        for (const cat of categories) {
            await pool.query("INSERT INTO menus (name, description) VALUES ($1, $2) ON CONFLICT DO NOTHING", [cat, `${cat} items`]);
        }

        // Get IDs
        const menuRes = await pool.query("SELECT id, name FROM menus");
        const menuMap = {};
        menuRes.rows.forEach(r => menuMap[r.name] = r.id);

        const foods = [
            { name: 'Spring Rolls', price: 5.99, menu: 'Appetizers', is_veg: true },
            { name: 'Grilled Chicken', price: 12.99, menu: 'Main Course', is_veg: false },
            { name: 'Beef Curry', price: 15.99, menu: 'Main Course', is_veg: false },
            { name: 'Chocolate Cake', price: 7.99, menu: 'Desserts', is_veg: true },
            { name: 'Cola', price: 2.99, menu: 'Drinks', is_veg: true }
        ];

        for (const f of foods) {
            await pool.query(`
            INSERT INTO foods (name, price, menu_id, is_vegetarian, is_available)
            VALUES ($1, $2, $3, $4, true)
            ON CONFLICT (name) DO NOTHING
          `, [f.name, f.price, menuMap[f.menu], f.is_veg]);
        }
        console.log('✅ Seeded tables and foods');

        console.log('Fix & Seed complete.');
        process.exit(0);

    } catch (err) {
        console.error('Fix DB Failed:', err);
        process.exit(1);
    }
}

fixDb();
