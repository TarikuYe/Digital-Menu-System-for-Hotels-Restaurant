import pool from '../config/database.js';

async function checkPaymentsTable() {
    try {
        const result = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'payments'
            ORDER BY ordinal_position;
        `);

        console.log('Payments table columns:');
        console.log(result.rows);

        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkPaymentsTable();
