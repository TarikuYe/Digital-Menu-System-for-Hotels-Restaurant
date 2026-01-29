import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from backend directory
dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

import pool from './backend/config/database.js';

async function runMigrations() {
    try {
        console.log('🔄 Running database migrations...\n');

        // List of migration files in order
        const migrations = [
            'database/schema.sql',
            'database/migration_v2.sql',
            'database/migration_v3_actor_model.sql',
            'database/update_users_table.sql',
            'database/update_users_status.sql',
            'database/fix_all_missing_columns.sql'
        ];

        for (const migrationFile of migrations) {
            const filePath = path.join(__dirname, migrationFile);

            if (!fs.existsSync(filePath)) {
                console.log(`⚠️  Skipping ${migrationFile} (file not found)`);
                continue;
            }

            console.log(`📄 Running: ${migrationFile}`);
            const sql = fs.readFileSync(filePath, 'utf8');

            try {
                await pool.query(sql);
                console.log(`✅ Completed: ${migrationFile}\n`);
            } catch (error) {
                // Some migrations might fail if tables already exist, that's okay
                if (error.code === '42P07' || error.message.includes('already exists')) {
                    console.log(`ℹ️  Skipped (already exists): ${migrationFile}\n`);
                } else {
                    console.error(`❌ Error in ${migrationFile}:`, error.message);
                }
            }
        }

        console.log('\n✅ All migrations completed!');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigrations();
