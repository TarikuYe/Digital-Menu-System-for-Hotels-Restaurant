import { writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPath = join(__dirname, '.env');

if (existsSync(envPath)) {
  console.log('⚠️  .env file already exists!');
  console.log('📝 If you want to recreate it, delete the existing file first.');
  process.exit(0);
}

// Generate a secure JWT secret
const jwtSecret = crypto.randomBytes(32).toString('base64');

const envContent = `# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hotel_menu_system
DB_USER=postgres
DB_PASSWORD=Tare@kiya

# JWT Configuration
# This is a randomly generated secret key - keep it secure!
JWT_SECRET=${jwtSecret}
JWT_EXPIRE=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
`;

try {
  writeFileSync(envPath, envContent);
  console.log('✅ .env file created successfully!');
  console.log(`📁 Location: ${envPath}`);
  console.log('\n📋 Configuration:');
  console.log('   - Database: hotel_menu_system');
  console.log('   - User: postgres');
  console.log('   - Password: Tare@kiya (from your setup)');
  console.log('   - JWT_SECRET: Generated randomly');
  console.log('   - Port: 5000');
  console.log('   - CORS: http://localhost:5173');
  console.log('\n💡 If your PostgreSQL password is different, edit DB_PASSWORD in .env');
  console.log('💡 Keep JWT_SECRET secure and never commit it to git!\n');
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
  process.exit(1);
}

