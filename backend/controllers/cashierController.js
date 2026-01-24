import pool from '../config/database.js';
import crypto from 'crypto';

/**
 * Get all orders ready for payment (served or ready)
 * Also includes orders that are partially paid (if we support that feature later)
 */
export const getOrdersForPayment = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
        o.id,
        o.table_number,
        o.status,
        o.total_amount,
        o.payment_status,
        o.created_at,
        u.full_name as customer_name,
        json_agg(
          json_build_object(
            'quantity', oi.quantity,
            'name', f.name,
            'price', oi.unit_price,
            'subtotal', oi.subtotal
          )
        ) as items
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN foods f ON oi.food_id = f.id
      WHERE o.status IN ('served', 'ready') AND o.payment_status != 'completed'
      GROUP BY o.id, u.full_name
      ORDER BY o.created_at ASC`
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching orders for payment:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Process a payment for an order
 */
export const processPayment = async (req, res) => {
    const client = await pool.connect();

    try {
        const { order_id, payment_method, amount_tendered } = req.body;

        if (!order_id || !payment_method || !amount_tendered) {
            return res.status(400).json({ error: 'Missing required payment details' });
        }

        await client.query('BEGIN');

        // 1. Get current order details
        const orderResult = await client.query(
            'SELECT total_amount, payment_status FROM orders WHERE id = $1 FOR UPDATE',
            [order_id]
        );

        if (orderResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Order not found' });
        }

        const order = orderResult.rows[0];
        const totalAmount = parseFloat(order.total_amount);
        const amountTendered = parseFloat(amount_tendered);

        if (amountTendered < totalAmount) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Insufficient payment amount' });
        }

        // 2. Create Payment Record
        const paymentResult = await client.query(
            `INSERT INTO payments 
       (order_id, payment_method, amount, status, processed_by, transaction_id)
       VALUES ($1, $2, $3, 'completed', $4, $5)
       RETURNING id, created_at`,
            [
                order_id,
                payment_method,
                totalAmount,
                req.user.userId,
                `TXTc-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
            ]
        );

        const payment = paymentResult.rows[0];

        // 3. Create Receipt Record
        const receiptNumber = `RCPT-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
        await client.query(
            `INSERT INTO receipts 
       (order_id, payment_id, receipt_number, subtotal, total_amount, generated_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
            [order_id, payment.id, receiptNumber, totalAmount, totalAmount, req.user.userId]
        );

        // 4. Update Order Status
        await client.query(
            `UPDATE orders 
       SET payment_status = 'completed', status = 'served', updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1`,
            [order_id]
        );

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Payment processed successfully',
            payment_id: payment.id,
            receipt_number: receiptNumber,
            change_due: amountTendered - totalAmount
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Payment processing error:', error);
        res.status(500).json({ error: 'Payment processing failed' });
    } finally {
        client.release();
    }
};

/**
 * Get daily stats for cashier
 */
export const getCashierStats = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
        COUNT(*) as transactions_count,
        COALESCE(SUM(amount), 0) as total_revenue
       FROM payments
       WHERE DATE(created_at) = CURRENT_DATE AND status = 'completed'`
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error getting cashier stats:', error);
        res.status(500).json({ error: error.message });
    }
};
