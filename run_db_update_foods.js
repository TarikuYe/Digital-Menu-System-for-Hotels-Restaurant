import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from backend directory specifically
dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

import pool from './backend/config/database.js';
import fs from 'fs';

async function runUpdate() {
    try {
        const sqlPath = path.join(__dirname, 'database', 'update_foods_v2.sql');
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
