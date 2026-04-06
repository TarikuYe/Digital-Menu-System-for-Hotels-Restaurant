import pool from '../config/database.js';

async function fixPaymentsTable() {
    try {
        console.log('Fixing payments table constraints...');

        // Make payment_method nullable (since it should be provided but we want better error handling)
        await pool.query(`
            ALTER TABLE payments 
            ALTER COLUMN payment_method DROP NOT NULL;
        `);

        console.log('✅ payment_method is now nullable');

        // Also make transaction_reference explicitly nullable if it isn't
        await pool.query(`
            ALTER TABLE payments 
            ALTER COLUMN transaction_reference DROP NOT NULL;
        `);

        console.log('✅ transaction_reference is now nullable');

        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        await pool.end();
        process.exit(1);
    }
}

fixPaymentsTable();
