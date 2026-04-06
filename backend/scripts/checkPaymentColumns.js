import pool from '../config/database.js';

async function checkColumns() {
    try {
        const result = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'payments'
            ORDER BY ordinal_position;
        `);

        console.log('Payments table structure:');
        console.log(JSON.stringify(result.rows, null, 2));

        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        await pool.end();
        process.exit(1);
    }
}

checkColumns();
