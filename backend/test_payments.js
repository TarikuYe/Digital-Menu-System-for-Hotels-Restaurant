import dotenv from 'dotenv';
dotenv.config();
import pool from './config/database.js';

async function checkPayments() {
    try {
        // Check if payments table exists
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'payments'
            );
        `);

        console.log('✅ Payments table exists:', tableCheck.rows[0].exists);

        if (tableCheck.rows[0].exists) {
            // Count payments
            const count = await pool.query('SELECT COUNT(*) FROM payments');
            console.log('📊 Total payments:', count.rows[0].count);

            // Try the stats query
            const stats = await pool.query(`
                SELECT 
                    SUM(CASE WHEN p.created_at >= CURRENT_DATE THEN amount ELSE 0 END) as daily_revenue,
                    SUM(CASE WHEN p.created_at >= DATE_TRUNC('week', CURRENT_DATE) THEN amount ELSE 0 END) as weekly_revenue,
                    SUM(CASE WHEN p.created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN amount ELSE 0 END) as monthly_revenue,
                    COUNT(CASE WHEN payment_method = 'cash' THEN 1 END) as cash_transactions,
                    COUNT(CASE WHEN payment_method = 'digital' THEN 1 END) as digital_transactions
                FROM payments p
                JOIN orders o ON p.order_id = o.id
                WHERE p.status = 'completed'
            `);

            console.log('📈 Stats query result:', stats.rows[0]);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Error code:', error.code);
    } finally {
        await pool.end();
    }
}

checkPayments();
