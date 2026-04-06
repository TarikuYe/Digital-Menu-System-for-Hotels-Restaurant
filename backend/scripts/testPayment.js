import pool from '../config/database.js';

async function testPaymentInsertion() {
    try {
        console.log('Testing payment insertion...');

        // First, get an existing order
        const orderResult = await pool.query('SELECT id FROM orders LIMIT 1');

        if (orderResult.rows.length === 0) {
            console.log('❌ No orders found in database. Create an order first.');
            await pool.end();
            process.exit(1);
        }

        const orderId = orderResult.rows[0].id;
        console.log('✅ Found order:', orderId);

        // Try to insert a test payment
        const paymentResult = await pool.query(
            `INSERT INTO payments (order_id, amount, payment_method, transaction_reference, status)
             VALUES ($1, $2, $3, $4, 'pending')
             RETURNING *`,
            [orderId, 50.00, 'cash', 'TEST-' + Date.now()]
        );

        console.log('✅ Payment inserted successfully:');
        console.log(paymentResult.rows[0]);

        // Clean up the test payment
        await pool.query('DELETE FROM payments WHERE id = $1', [paymentResult.rows[0].id]);
        console.log('✅ Test payment cleaned up');

        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        console.error('Error code:', error.code);
        console.error('Error detail:', error.detail);
        await pool.end();
        process.exit(1);
    }
}

testPaymentInsertion();
