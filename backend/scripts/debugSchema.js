import pool from '../config/database.js';


async function check() {
    try {
        const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log('Tables:', tables.rows.map(t => t.table_name));

        const orderItems = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'order_items'");
        console.log('Order Items Columns:', orderItems.rows.map(r => r.column_name));

        const orders = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'orders'");
        console.log('Orders Columns:', orders.rows.map(r => r.column_name));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
