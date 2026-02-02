
import pool from '../config/database.js';

async function test() {
    try {
        const res = await pool.query("SELECT id, user_id, guest_session_id, table_number FROM orders ORDER BY created_at DESC LIMIT 5");
        console.log('--- RECENT ORDERS ---');
        console.log(JSON.stringify(res.rows, null, 2));

        const guests = await pool.query("SELECT id, guest_name FROM guest_sessions LIMIT 5");
        console.log('--- GUESTS ---');
        console.log(JSON.stringify(guests.rows, null, 2));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
test();
