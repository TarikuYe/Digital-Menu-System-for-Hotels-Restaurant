
import pool from './config/database.js';

async function checkUsers() {
    try {
        const res = await pool.query("SELECT id, full_name, role, email FROM users WHERE role IN ('staff', 'waiter', 'admin', 'manager')");
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkUsers();
