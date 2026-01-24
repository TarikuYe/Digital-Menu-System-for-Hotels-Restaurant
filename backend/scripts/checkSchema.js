
import pool from '../config/database.js';

async function checkSchema() {
    console.log('--- Checking Schema ---');
    try {
        // Check tables
        const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
        console.log('Tables:', tables.rows.map(t => t.table_name));

        // Check restaurant_tables columns
        const rtCols = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'restaurant_tables'
    `);
        console.log('restaurant_tables columns:', rtCols.rows.map(c => c.column_name));

        // Check orders columns
        const orderCols = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'orders'
    `);
        console.log('orders columns:', orderCols.rows.map(c => c.column_name));

        process.exit(0);
    } catch (err) {
        console.error('Check failed:', err);
        process.exit(1);
    }
}

checkSchema();
