export const errorHandler = (err, req, res, next) => {
  // Log full error for debugging
  console.error('❌ Error occurred:');
  console.error('   Path:', req.path);
  console.error('   Method:', req.method);
  console.error('   Error:', err.message);
  if (err.code) {
    console.error('   Error Code:', err.code);
  }
  if (err.stack && process.env.NODE_ENV === 'development') {
    console.error('   Stack:', err.stack);
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.message,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired',
    });
  }

  // Database connection errors
  if (err.code === '28P01') {
    return res.status(500).json({
      error: 'Database authentication failed',
      message: 'Please check database credentials',
    });
  }

  if (err.code === 'ECONNREFUSED') {
    return res.status(500).json({
      error: 'Database connection failed',
      message: 'Cannot connect to database server',
    });
  }

  if (err.code === '3D000') {
    return res.status(500).json({
      error: 'Database not found',
      message: 'Database does not exist',
    });
  }

  // Database errors
  if (err.code === '23505') { // Unique violation
    return res.status(409).json({
      error: 'Duplicate entry',
      details: err.detail,
    });
  }

  if (err.code === '23503') { // Foreign key violation
    return res.status(400).json({
      error: 'Invalid reference',
      details: err.detail,
    });
  }

  // JWT secret missing
  if (err.message && err.message.includes('secret')) {
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'JWT secret is not configured',
    });
  }

  // Default error
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      code: err.code,
    }),
  });
};

export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

