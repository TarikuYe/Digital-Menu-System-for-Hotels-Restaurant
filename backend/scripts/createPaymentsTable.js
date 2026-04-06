import pool from '../config/database.js';

async function createPaymentsTable() {
    try {
        console.log('Creating payments table...');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS payments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
                amount DECIMAL(10, 2) NOT NULL,
                payment_method VARCHAR(50) NOT NULL,
                transaction_reference VARCHAR(255),
                status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('✅ Payments table created successfully');

        // Create index for faster queries
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
            CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
            CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);
        `);

        console.log('✅ Indexes created successfully');

        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating payments table:', error);
        process.exit(1);
    }
}

createPaymentsTable();
