
import pool from '../config/database.js';

const seedFoods = async () => {
    try {
        console.log('Seeding foods...');

        // 1. Create Menus (Categories)
        const menus = ['Appetizers', 'Main Course', 'Desserts', 'Drinks'];
        const menuIds = {};

        for (const menuName of menus) {
            const res = await pool.query(
                `INSERT INTO menus (name, description, display_order) 
         VALUES ($1, $2, $3) 
         ON CONFLICT DO NOTHING
         RETURNING id`,
                [menuName, `${menuName} items`, 1]
            );

            // If conflict, we need to fetch the id
            if (res.rows.length > 0) {
                menuIds[menuName] = res.rows[0].id;
            } else {
                const fetchRes = await pool.query('SELECT id FROM menus WHERE name = $1', [menuName]);
                menuIds[menuName] = fetchRes.rows[0].id;
            }
        }

        // 2. Create Foods
        const foods = [
            {
                name: 'Spring Rolls',
                description: 'Crispy veggie rolls served with sweet chili sauce',
                price: 5.99,
                menu: 'Appetizers',
                image_url: 'https://images.unsplash.com/photo-1544510808-91bcbee1df55?auto=format&fit=crop&w=500&q=60',
                is_veg: true,
                spice_level: 1
            },
            {
                name: 'Grilled Chicken Salad',
                description: 'Fresh salad with grilled chicken breast and vinaigrette',
                price: 12.99,
                menu: 'Main Course',
                image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=60',
                is_veg: false,
                spice_level: 0
            },
            {
                name: 'Spicy Beef Curry',
                description: 'Traditional beef curry with aromatic spices',
                price: 15.99,
                menu: 'Main Course',
                image_url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=500&q=60',
                is_veg: false,
                spice_level: 4
            },
            {
                name: 'Chocolate Lava Cake',
                description: 'Molten chocolate cake with vanilla ice cream',
                price: 7.99,
                menu: 'Desserts',
                image_url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=500&q=60',
                is_veg: true,
                spice_level: 0
            },
            {
                name: 'Fresh Lime Soda',
                description: 'Refreshing lime drink with mint',
                price: 3.99,
                menu: 'Drinks',
                image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=500&q=60',
                is_veg: true,
                spice_level: 0
            }
        ];

        for (const food of foods) {
            await pool.query(
                `INSERT INTO foods (name, description, price, menu_id, image_url, is_vegetarian, spice_level, is_available)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true)
         ON CONFLICT (name) DO NOTHING`, // Assuming name constraint or just adding duplicates if not
                [food.name, food.description, food.price, menuIds[food.menu], food.image_url, food.is_veg, food.spice_level]
            );
        }

        console.log('✅ Seeding completed successfully');
        process.exit(0);

    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedFoods();
