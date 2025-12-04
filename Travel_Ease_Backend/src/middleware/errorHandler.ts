/**
 * Centralized Error Handler Middleware
 * 
 * Handles various error types and returns appropriate HTTP responses.
 * Uses structured logging for error tracking.
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { logger } from '../lib/logger.js';

interface AppError extends Error {
  code?: string;
  status?: number;
  details?: unknown;
}

export const errorHandler = (err: AppError, req: Request, res: Response, _next: NextFunction) => {
  const requestId = (req as any).requestId;
  const isProduction = process.env.NODE_ENV === 'production';

  // Build error context for logging
  const errorContext = {
    requestId,
    method: req.method,
    path: req.originalUrl,
    userId: req.user?.id,
    errorCode: err.code,
    errorName: err.name,
  };

  // Prisma connection/server errors (P1xxx) - return 503
  if (err.code?.startsWith('P1')) {
    const connectionErrorMessages: Record<string, string> = {
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

    logger.error({ ...errorContext, err }, 'Database connection error');

    return res.status(503).json({
      error: 'Database connection error',
      message: connectionErrorMessages[err.code] || 'Database server unavailable',
      code: err.code,
      requestId,
      details: !isProduction ? err.message : undefined
    });
  }

  // Handle PrismaClientInitializationError (may have undefined code)
  if (err.constructor?.name === 'PrismaClientInitializationError' ||
      err.name === 'PrismaClientInitializationError') {
    
    logger.error({ ...errorContext, err }, 'Prisma initialization error');
    
    return res.status(503).json({
      error: 'Database connection error',
      message: 'Unable to connect to database. Please try again later.',
      code: err.code || 'CONNECTION_ERROR',
      requestId,
      details: !isProduction ? err.message : undefined
    });
  }

  // Prisma client/request errors (P2xxx) - return 400
  if (err.code?.startsWith('P2')) {
    const prismaErrorMessages: Record<string, string> = {
      'P2002': 'A record with this value already exists (duplicate)',
      'P2003': 'Foreign key constraint failed',
      'P2025': 'Record not found',
      'P2014': 'Invalid ID provided',
      'P2011': 'Null constraint violation',
      'P2012': 'Missing required value',
      'P2021': 'Table does not exist in the database',
      'P2022': 'Column does not exist in the database',
    };

    // P2025 (not found) is often expected, log as warning
    if (err.code === 'P2025') {
      logger.warn({ ...errorContext }, 'Record not found');
    } else {
      logger.error({ ...errorContext, err }, 'Prisma client error');
    }

    return res.status(err.code === 'P2025' ? 404 : 400).json({
      error: 'Database error',
      message: prismaErrorMessages[err.code] || 'Database operation failed',
      code: err.code,
      requestId,
      details: !isProduction ? err.message : undefined
    });
  }

  // Other Prisma errors (P3xxx migration, P4xxx introspection, P5xxx data proxy)
  if (err.code?.startsWith('P')) {
    logger.error({ ...errorContext, err }, 'Prisma error');
    
    return res.status(500).json({
      error: 'Database error',
      message: 'A database error occurred',
      code: err.code,
      requestId,
      details: !isProduction ? err.message : undefined
    });
  }

  // Zod validation errors
  if (err instanceof z.ZodError) {
    logger.warn({ ...errorContext, validationErrors: err.errors }, 'Validation failed');
    
    return res.status(400).json({
      error: 'Validation failed',
      requestId,
      details: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    logger.warn({ ...errorContext }, 'Invalid JWT token');
    
    return res.status(401).json({
      error: 'Invalid token',
      requestId,
      details: !isProduction ? err.message : undefined
    });
  }

  if (err.name === 'TokenExpiredError') {
    logger.warn({ ...errorContext }, 'Expired JWT token');
    
    return res.status(401).json({
      error: 'Token expired',
      requestId,
      details: 'Please login again'
    });
  }

  // Multer errors (file uploads)
  if (err.name === 'MulterError') {
    logger.warn({ ...errorContext, multerCode: (err as any).code }, 'File upload error');
    
    return res.status(400).json({
      error: 'File upload error',
      message: err.message,
      requestId
    });
  }

  // Custom API errors (with status property)
  if (err.status) {
    const logLevel = err.status >= 500 ? 'error' : 'warn';
    logger[logLevel]({ ...errorContext, err }, 'API error');
    
    return res.status(err.status).json({
      error: err.message || 'Error occurred',
      requestId,
      details: err.details
    });
  }

  // Default server error
  logger.error({
    ...errorContext,
    err: {
      message: err.message,
      stack: err.stack,
      name: err.name,
    }
  }, 'Unhandled error');

  res.status(500).json({
    error: 'Internal server error',
    message: !isProduction ? err.message : 'An unexpected error occurred',
    requestId,
    trace: !isProduction ? err.stack : undefined
  });
};
