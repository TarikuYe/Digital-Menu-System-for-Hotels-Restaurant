import pool from './backend/config/database.js';

async function checkUsers() {
    try {
        const result = await pool.query('SELECT email, role, password_hash FROM users');
        console.log(JSON.stringify(result.rows, null, 2));
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkUsers();
