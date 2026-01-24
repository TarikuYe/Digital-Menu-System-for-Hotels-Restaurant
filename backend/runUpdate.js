import pool from './config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runUpdate() {
    try {
        const sqlPath = path.join(__dirname, '..', 'database', 'update_foods_v2_part2.sql');


        const sql = fs.readFileSync(sqlPath, 'utf8');
        console.log('Running SQL update for foods...');
        await pool.query(sql);
        console.log('✅ Foods table updated successfully');
    } catch (error) {
        console.error('❌ Error updating foods table:', error.message);
    } finally {
        await pool.end();
    }
}

runUpdate();
