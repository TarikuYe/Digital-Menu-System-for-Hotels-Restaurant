import pool from '../config/database.js';

async function simpleTest() {
    try {
        // Try inserting with minimal data
        const result = await pool.query(`
            INSERT INTO payments (order_id, amount) 
            VALUES ('02ed61b3-e0b4-40c2-8620-7d7a0f0e9e31', 10.00)
            RETURNING *
        `);

        console.log('Success:', result.rows[0]);

        // Clean up
        await pool.query('DELETE FROM payments WHERE id = $1', [result.rows[0].id]);

        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Column:', error.column);
        console.error('Position:', error.position);
        await pool.end();
        process.exit(1);
    }
}

simpleTest();
