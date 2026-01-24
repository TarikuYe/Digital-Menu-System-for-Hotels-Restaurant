
import pool from '../config/database.js';

async function checkSchemaDetailed() {
    console.log('--- Checking Schema Detailed ---');
    try {
        // Check tables
        const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
        console.log('Tables:', tables.rows.map(t => t.table_name));

        if (!tables.rows.some(t => t.table_name === 'restaurant_tables')) {
            console.error('❌ restaurant_tables DOES NOT EXIST');
        } else {
            const rtCols = await pool.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'restaurant_tables'
        `);
            console.log('restaurant_tables columns:', rtCols.rows.map(c => c.column_name));
        }

        if (!tables.rows.some(t => t.table_name === 'orders')) {
            console.error('❌ orders DOES NOT EXIST');
        } else {
            const orderCols = await pool.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'orders'
        `);
            console.log('orders columns:', orderCols.rows.map(c => c.column_name));
        }

        process.exit(0);
    } catch (err) {
        console.error('Check failed:', err);
        process.exit(1);
    }
}

checkSchemaDetailed();
