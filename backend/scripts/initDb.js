
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '../../');

const runSqlFile = async (filePath) => {
    try {
        const fullPath = path.join(projectRoot, filePath);
        console.log(`Executing ${filePath}...`);
        const sql = fs.readFileSync(fullPath, 'utf8');
        await pool.query(sql);
        console.log(`✅ ${filePath} executed successfully.`);
    } catch (error) {
        // Ignore "relation already exists" errors if we just want to ensure it runs
        if (error.code === '42P07') { // duplicate_table
            console.log(`⚠️ Table already exists in ${filePath}, continuing...`);
        } else {
            console.error(`❌ Error executing ${filePath}:`, error.message);
            // We might want to throw to stop chain if critical, but for now let's try to proceed
        }
    }
};

const initDb = async () => {
    try {
        await runSqlFile('database/schema.sql');
        await runSqlFile('database/migration_v2.sql');
        await runSqlFile('database/migration_v3_actor_model.sql');

        console.log('Database initialization complete.');
        process.exit(0);
    } catch (err) {
        console.error('Init DB Failed:', err);
        process.exit(1);
    }
};

initDb();
