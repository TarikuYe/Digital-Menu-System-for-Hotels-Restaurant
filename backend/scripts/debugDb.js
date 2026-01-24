
import pool from '../config/database.js';

async function debugDb() {
    console.log('DEBUGGING DB STATE...');
    console.log('DB Name:', process.env.DB_NAME);

    try {
        const res = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
        console.log('Existing Tables:', res.rows.map(r => r.table_name));

        // Check if users exists
        const userRes = await pool.query("SELECT count(*) FROM users");
        console.log('User count:', userRes.rows[0].count);

    } catch (err) {
        console.error('Debug Failed:', err.message);
    }
    process.exit(0);
}

debugDb();
