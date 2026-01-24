
import bcrypt from 'bcryptjs';
import pool from '../config/database.js';

const seedUsers = async () => {
    console.log('Seeding Kitchen and Staff users...');

    const users = [
        { email: 'kitchen@hotel.com', password: 'password123', name: 'Head Chef', role: 'kitchen' },
        { email: 'waiter@hotel.com', password: 'password123', name: 'John Waiter', role: 'staff' },
        { email: 'cashier@hotel.com', password: 'password123', name: 'Jane Cashier', role: 'cashier' },
        { email: 'manager@hotel.com', password: 'password123', name: 'Mr. Manager', role: 'manager' }
    ];

    try {
        for (const u of users) {
            const hash = await bcrypt.hash(u.password, 10);
            await pool.query(`
                INSERT INTO users (email, password_hash, full_name, role)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (email) DO UPDATE 
                SET password_hash = $2, role = $4
             `, [u.email, hash, u.name, u.role]);
            console.log(`✅ User ${u.email} seeded/updated.`);
        }
        console.log('Done seeding users.');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding users:', error);
        process.exit(1);
    }
};

seedUsers();
