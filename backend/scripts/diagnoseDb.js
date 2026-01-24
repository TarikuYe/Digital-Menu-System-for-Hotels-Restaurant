
import pool from '../config/database.js';

async function diagnose() {
    console.log('Diagnosing menus table...');
    try {
        const res = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'menus'
      `);
        console.log('Columns:', res.rows);

        const constraints = await pool.query(`
        SELECT constraint_name, constraint_type
        FROM information_schema.table_constraints
        WHERE table_name = 'menus'
      `);
        console.log('Constraints:', constraints.rows);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

diagnose();
