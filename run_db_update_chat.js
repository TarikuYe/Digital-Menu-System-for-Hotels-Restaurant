import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from backend directory specifically
dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

import pool from './backend/config/database.js';

async function runUpdate() {
    try {
        const sqlPath = path.join(__dirname, 'database', 'update_chat_v1.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        console.log('Running SQL update for Chat & Internal Messaging...');
        await pool.query(sql);
        console.log('✅ Chat & Internal Messaging tables updated successfully');
    } catch (error) {
        console.error('❌ Error updating database:', error.message);
    } finally {
        await pool.end();
    }
}

runUpdate();
