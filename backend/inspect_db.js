
import pool from './config/database.js';

async function inspect() {
    try {
        const branches = await pool.query("SELECT id, name FROM branches");
        console.log('--- BRANCHES ---');
        console.log(JSON.stringify(branches.rows, null, 2));

        const users = await pool.query("SELECT email, role, branch_id FROM users");
        console.log('--- USERS ---');
        console.log(JSON.stringify(users.rows, null, 2));

        const orders = await pool.query("SELECT id, status, branch_id FROM orders");
        console.log('--- ORDERS ---');
        console.log(JSON.stringify(orders.rows, null, 2));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
inspect();
