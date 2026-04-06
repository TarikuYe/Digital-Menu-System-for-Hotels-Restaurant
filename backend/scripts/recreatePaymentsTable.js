import pool from '../config/database.js';

async function recreatePaymentsTable() {
    try {
        console.log('Dropping existing payments table if it exists...');
        await pool.query('DROP TABLE IF EXISTS payments CASCADE;');
        console.log('✅ Old table dropped');

        console.log('Creating payments table with correct schema...');

        await pool.query(`
            CREATE TABLE payments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
                amount DECIMAL(10, 2) NOT NULL,
                payment_method VARCHAR(50),
                transaction_reference VARCHAR(255),
                status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('✅ Payments table created successfully');

        // Create indexes
        await pool.query(`
            CREATE INDEX idx_payments_order_id ON payments(order_id);
            CREATE INDEX idx_payments_status ON payments(status);
            CREATE INDEX idx_payments_created_at ON payments(created_at);
        `);

        console.log('✅ Indexes created successfully');

        // Test insertion
        const testOrder = await pool.query('SELECT id FROM orders LIMIT 1');
        if (testOrder.rows.length > 0) {
            const testResult = await pool.query(
                `INSERT INTO payments (order_id, amount, payment_method, transaction_reference, status)
                 VALUES ($1, $2, $3, $4, 'pending')
                 RETURNING *`,
                [testOrder.rows[0].id, 50.00, 'cash', 'TEST-' + Date.now()]
            );
            console.log('✅ Test insertion successful:', testResult.rows[0].id);

            // Clean up test
            await pool.query('DELETE FROM payments WHERE id = $1', [testResult.rows[0].id]);
            console.log('✅ Test payment cleaned up');
        }

        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Code:', error.code);
        console.error('Detail:', error.detail);
        await pool.end();
        process.exit(1);
    }
}

recreatePaymentsTable();
