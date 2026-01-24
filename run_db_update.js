import pool from './backend/config/database.js';
import fs from 'fs';
import path from 'path';

async function runUpdate() {
    try {
        const sql = fs.readFileSync(path.join(process.cwd(), 'database', 'update_users_table.sql'), 'utf8');
        console.log('Running SQL update...');
        await pool.query(sql);
        console.log('✅ Users table updated successfully');
    } catch (error) {
        console.error('❌ Error updating users table:', error.message);
    } finally {
        await pool.end();
    }
}

runUpdate();
