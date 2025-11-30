import { z } from 'zod';

export const errorHandler = (err, req, res, next) => {
  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error occurred:', {
      message: err.message,
      code: err.code,
      stack: err.stack
    });
  } else {
    console.error('Error:', err.message);
  }

  // Prisma connection/server errors (P1xxx) - return 500
  if (err.code?.startsWith('P1')) {
    const connectionErrorMessages = {
      'P1001': 'Cannot connect to database server',
      'P1002': 'Database server connection timed out',
      'P1003': 'Database does not exist',
      'P1008': 'Operation timed out',
      'P1009': 'Database already exists',
      'P1010': 'User was denied access',
      'P1011': 'Error opening TLS connection',
      'P1012': 'Schema validation error',
      'P1013': 'Invalid database connection string',
      'P1014': 'Underlying model does not exist',
      'P1015': 'Prisma schema uses unsupported features',
      'P1016': 'Raw query parameter count mismatch',
      'P1017': 'Server closed the connection',
    };

    return res.status(503).json({
      error: 'Database connection error',
      message: connectionErrorMessages[err.code] || 'Database server unavailable',
      code: err.code,
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  // Handle PrismaClientInitializationError (may have undefined code)
  if (err.constructor?.name === 'PrismaClientInitializationError' ||
      err.name === 'PrismaClientInitializationError') {
    return res.status(503).json({
      error: 'Database connection error',
      message: 'Unable to connect to database. Please try again later.',
      code: err.code || 'CONNECTION_ERROR',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  // Prisma client/request errors (P2xxx) - return 400
  if (err.code?.startsWith('P2')) {
    const prismaErrorMessages = {
      'P2002': 'A record with this value already exists (duplicate)',
      'P2003': 'Foreign key constraint failed',
      'P2025': 'Record not found',
      'P2014': 'Invalid ID provided',
      'P2011': 'Null constraint violation',
      'P2012': 'Missing required value',
      'P2021': 'Table does not exist in the database',
      'P2022': 'Column does not exist in the database',
    };

    return res.status(400).json({
      error: 'Database error',
      message: prismaErrorMessages[err.code] || 'Database operation failed',
      code: err.code,
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  // Other Prisma errors (P3xxx migration, P4xxx introspection, P5xxx data proxy)
  if (err.code?.startsWith('P')) {
    return res.status(500).json({
      error: 'Database error',
      message: 'A database error occurred',
      code: err.code,
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  // Zod validation errors
  if (err instanceof z.ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired',
      details: 'Please login again'
    });
  }

  // Multer errors (file uploads)
  if (err.name === 'MulterError') {
    return res.status(400).json({
      error: 'File upload error',
      message: err.message
    });
  }

  // Custom API errors (with status property)
  if (err.status) {
    return res.status(err.status).json({
      error: err.message || 'Error occurred',
      details: err.details
    });
  }

  // Default server error
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
    trace: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};
