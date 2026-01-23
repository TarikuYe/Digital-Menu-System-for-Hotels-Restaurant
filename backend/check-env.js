import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPath = join(__dirname, '.env');

console.log('🔍 Checking .env file configuration...\n');

if (!existsSync(envPath)) {
  console.log('❌ .env file not found!');
  console.log('💡 Run: node create-env.js to create it.\n');
  process.exit(1);
}

// Load environment variables
dotenv.config({ path: envPath });

console.log('✅ .env file found!\n');
console.log('📋 Current Configuration:\n');

const requiredVars = {
  'PORT': process.env.PORT || 'NOT SET',
  'NODE_ENV': process.env.NODE_ENV || 'NOT SET',
  'DB_HOST': process.env.DB_HOST || 'NOT SET',
  'DB_PORT': process.env.DB_PORT || 'NOT SET',
  'DB_NAME': process.env.DB_NAME || 'NOT SET',
  'DB_USER': process.env.DB_USER || 'NOT SET',
  'DB_PASSWORD': process.env.DB_PASSWORD ? '***SET***' : 'NOT SET',
  'JWT_SECRET': process.env.JWT_SECRET ? '***SET***' : 'NOT SET',
  'JWT_EXPIRE': process.env.JWT_EXPIRE || 'NOT SET',
  'CORS_ORIGIN': process.env.CORS_ORIGIN || 'NOT SET',
};

let allGood = true;

for (const [key, value] of Object.entries(requiredVars)) {
  const status = value === 'NOT SET' ? '❌' : '✅';
  if (value === 'NOT SET') allGood = false;
  
  if (key === 'DB_PASSWORD' || key === 'JWT_SECRET') {
    console.log(`   ${status} ${key}: ${value}`);
  } else {
    console.log(`   ${status} ${key}: ${value}`);
  }
}

console.log('\n');

if (!allGood) {
  console.log('⚠️  Some required variables are missing!\n');
  console.log('📝 Required .env file content:\n');
  console.log(`PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=hotel_menu_system
DB_USER=postgres
DB_PASSWORD=Tare@kiya

JWT_SECRET=your_random_secret_key_here
JWT_EXPIRE=7d

CORS_ORIGIN=http://localhost:5173
`);
  console.log('💡 Edit backend/.env file and add missing variables.\n');
  process.exit(1);
} else {
  console.log('✅ All required environment variables are set!\n');
  
  // Additional checks
  if (process.env.JWT_SECRET === 'your_super_secret_jwt_key_change_in_production' || 
      process.env.JWT_SECRET.length < 20) {
    console.log('⚠️  WARNING: JWT_SECRET appears to be using default or weak value!');
    console.log('💡 Generate a secure secret: node create-env.js\n');
  }
  
  if (!process.env.DB_PASSWORD || process.env.DB_PASSWORD === 'your_password_here') {
    console.log('⚠️  WARNING: DB_PASSWORD may not be set correctly!');
    console.log('💡 Make sure it matches your PostgreSQL password.\n');
  }
  
  console.log('✨ Configuration looks good! You can start the server now.\n');
}

