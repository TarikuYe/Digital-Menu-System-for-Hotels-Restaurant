import pool from './config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runUpdate() {
    try {
        const sqlPath = path.join(__dirname, '..', 'database', 'update_chat_v1.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        console.log('Running SQL update for Chat...');
        await pool.query(sql);
        console.log('✅ Chat table created successfully');
    } catch (error) {
        console.error('❌ Error updating database:', error.message);
    } finally {
        await pool.end();
        process.exit();
    }
}

runUpdate();
