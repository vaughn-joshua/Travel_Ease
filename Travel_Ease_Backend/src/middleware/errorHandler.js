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

  // Prisma errors
  if (err.code?.startsWith('P')) {
    const prismaErrorMessages = {
      'P2002': 'A record with this value already exists (duplicate)',
      'P2003': 'Foreign key constraint failed',
      'P2025': 'Record not found',
      'P2014': 'Invalid ID provided',
      'P2011': 'Null constraint violation',
      'P2012': 'Missing required value',
    };

    return res.status(400).json({
      error: 'Database error',
      message: prismaErrorMessages[err.code] || 'Database operation failed',
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
