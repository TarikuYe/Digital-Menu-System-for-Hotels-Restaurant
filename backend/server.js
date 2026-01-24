import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import pool from './config/database.js';

// Import routes
import authRoutes from './routes/auth.js';
import foodRoutes from './routes/foods.js';
import menuRoutes from './routes/menus.js';
import orderRoutes from './routes/orders.js';
import feedbackRoutes from './routes/feedback.js';
import kitchenRoutes from './routes/kitchen.js';
import cashierRoutes from './routes/cashier.js';
import guestRoutes from './routes/guest.js';
import tableRoutes from './routes/tables.js';
import managerRoutes from './routes/manager.js';
import adminRoutes from './routes/admin.js';
import localizationRoutes from './routes/localization.js';
import paymentRoutes from './routes/payments.js';
import analyticsRoutes from './routes/analytics.js';
import communicationRoutes from './routes/communications.js';
import settingsRoutes from './routes/settings.js';
import auditRoutes from './routes/audit.js';
import branchRoutes from './routes/branches.js';
import exportRoutes from './routes/export.js';
import integrationRoutes from './routes/integrations.js';









// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'DB_PASSWORD'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(envVar => {
    console.error(`   - ${envVar}`);
  });
  console.error('\n💡 Please check your .env file in the backend directory.');
  console.error('💡 You can copy .env.example and fill in the values.\n');

  // Don't exit in development, but warn
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/menus', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/kitchen', kitchenRoutes);
app.use('/api/cashier', cashierRoutes);
app.use('/api/guest', guestRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/localization', localizationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/communications', communicationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/integrations', integrationRoutes);










// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

// Test database connection on startup
async function startServer() {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    if (error.code === '28P01') {
      console.error('💡 Authentication failed. Check DB_PASSWORD in .env');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('💡 Connection refused. Is PostgreSQL running?');
    } else if (error.code === '3D000') {
      console.error('💡 Database does not exist. Run schema.sql first.');
    }
    console.error('⚠️  Server will start but database operations will fail.\n');
  }

  // Start server
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your_super_secret_jwt_key_change_in_production') {
      console.warn('⚠️  WARNING: JWT_SECRET is not set or using default value!');
    }
    console.log('');
  });
}

startServer();


// Triggering restart
