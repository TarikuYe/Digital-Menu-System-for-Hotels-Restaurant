import bcrypt from 'bcryptjs';
import readline from 'readline';
import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setupAdmin() {
  let pool;
  
  try {
    console.log('🔐 Admin User Setup\n');
    
    // First, get database password if not in .env
    let dbPassword = process.env.DB_PASSWORD;
    if (!dbPassword) {
      console.log('⚠️  Database password not found in .env file');
      dbPassword = await question('Enter PostgreSQL password for user "' + (process.env.DB_USER || 'postgres') + '": ');
      if (!dbPassword) {
        console.error('❌ Database password is required!');
        process.exit(1);
      }
    }
    
    // Create database connection with password
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'hotel_menu_system',
      user: process.env.DB_USER || 'postgres',
      password: String(dbPassword),
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful!\n');
    
    const email = await question('Enter admin email (default: admin@hotel.com): ') || 'admin@hotel.com';
    const password = await question('Enter admin password: ');
    
    if (!password) {
      console.error('❌ Password is required!');
      process.exit(1);
    }
    
    const fullName = await question('Enter admin full name (default: System Administrator): ') || 'System Administrator';
    
    // Hash password
    console.log('\n⏳ Hashing password...');
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Check if admin exists
    const existingAdmin = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    
    if (existingAdmin.rows.length > 0) {
      // Update existing admin
      await pool.query(
        'UPDATE users SET password_hash = $1, full_name = $2 WHERE email = $3',
        [passwordHash, fullName, email]
      );
      console.log('✅ Admin user updated successfully!');
    } else {
      // Create new admin
      await pool.query(
        'INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4)',
        [email, passwordHash, fullName, 'admin']
      );
      console.log('✅ Admin user created successfully!');
    }
    
    console.log(`\n📧 Email: ${email}`);
    console.log(`👤 Name: ${fullName}`);
    console.log('🔑 Password: [HIDDEN]');
    console.log('\n✨ Setup complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === '28P01') {
      console.error('💡 Authentication failed. Please check your PostgreSQL password.');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('💡 Connection refused. Please ensure PostgreSQL is running.');
    } else if (error.code === '3D000') {
      console.error('💡 Database does not exist. Please create the database first.');
    }
    process.exit(1);
  } finally {
    rl.close();
    if (pool) {
      await pool.end();
    }
  }
}

setupAdmin();

