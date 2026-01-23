import pkg from 'pg';
import dotenv from 'dotenv';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from backend directory
dotenv.config({ path: join(__dirname, '..', '.env') });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function checkDatabase() {
  try {
    console.log('🔍 Database Connection Check\n');
    
    // Check if .env file exists
    const envPath = join(__dirname, '..', '.env');
    if (!existsSync(envPath)) {
      console.log('⚠️  .env file not found!');
      console.log('📝 Creating .env file from template...\n');
      
      const fs = await import('fs');
      const envExample = `# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hotel_menu_system
DB_USER=postgres
DB_PASSWORD=your_password_here

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
`;
      
      fs.writeFileSync(envPath, envExample);
      console.log('✅ .env file created! Please edit it with your database credentials.\n');
    }
    
    // Get database configuration
    let dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'hotel_menu_system',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
    };
    
    // If password is not set, prompt for it
    if (!dbConfig.password || dbConfig.password === 'your_password_here') {
      console.log('⚠️  Database password not configured in .env');
      dbConfig.password = await question(`Enter PostgreSQL password for user "${dbConfig.user}": `);
      if (!dbConfig.password) {
        console.error('❌ Password is required!');
        process.exit(1);
      }
    }
    
    // Ensure password is a string
    dbConfig.password = String(dbConfig.password);
    
    console.log('\n📊 Configuration:');
    console.log(`   Host: ${dbConfig.host}`);
    console.log(`   Port: ${dbConfig.port}`);
    console.log(`   Database: ${dbConfig.database}`);
    console.log(`   User: ${dbConfig.user}`);
    console.log(`   Password: ${'*'.repeat(dbConfig.password.length)}\n`);
    
    console.log('⏳ Connecting to database...');
    
    // Create connection pool
    const pool = new Pool({
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.user,
      password: dbConfig.password,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    
    // Test connection
    const result = await pool.query('SELECT NOW() as current_time, version() as version');
    console.log('✅ Database connection successful!\n');
    
    console.log('📅 Current Time:', result.rows[0].current_time);
    console.log('🗄️  PostgreSQL Version:', result.rows[0].version.split('\n')[0]);
    
    // Check if tables exist
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log(`\n📋 Found ${tablesResult.rows.length} tables:`);
      tablesResult.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.table_name}`);
      });
    } else {
      console.log('\n⚠️  No tables found. You may need to run the schema.sql script.');
    }
    
    // Check users table
    try {
      const userCount = await pool.query('SELECT COUNT(*) as count FROM users');
      console.log(`\n👥 Users in database: ${userCount.rows[0].count}`);
      
      const adminCount = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
      console.log(`   Admin users: ${adminCount.rows[0].count}`);
    } catch (err) {
      console.log('\n⚠️  Users table not found. Run schema.sql to create tables.');
    }
    
    await pool.end();
    console.log('\n✨ Database check complete!');
    
  } catch (error) {
    console.error('\n❌ Database connection failed!\n');
    
    if (error.code === '28P01') {
      console.error('💡 Authentication failed.');
      console.error('   - Check your PostgreSQL password');
      console.error('   - Verify the username is correct');
      console.error('   - Update DB_PASSWORD in .env file');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('💡 Connection refused.');
      console.error('   - Ensure PostgreSQL is running');
      console.error('   - Check DB_HOST and DB_PORT in .env');
      console.error('   - Windows: Check Services → PostgreSQL');
      console.error('   - Linux/Mac: Run "pg_isready" to check status');
    } else if (error.code === '3D000') {
      console.error('💡 Database does not exist.');
      console.error(`   - Create database: CREATE DATABASE ${process.env.DB_NAME || 'hotel_menu_system'};`);
      console.error('   - Or update DB_NAME in .env file');
    } else if (error.code === 'ENOTFOUND') {
      console.error('💡 Host not found.');
      console.error('   - Check DB_HOST in .env file');
      console.error('   - Ensure PostgreSQL is accessible');
    } else {
      console.error('💡 Error details:', error.message);
      console.error('   Error code:', error.code);
    }
    
    console.log('\n📝 Make sure your .env file has correct values:');
    console.log('   DB_HOST=localhost');
    console.log('   DB_PORT=5432');
    console.log('   DB_NAME=hotel_menu_system');
    console.log('   DB_USER=postgres');
    console.log('   DB_PASSWORD=your_actual_password');
    
    process.exit(1);
  } finally {
    rl.close();
  }
}

checkDatabase();

