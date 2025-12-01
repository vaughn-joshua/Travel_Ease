/**
 * Prisma Query Helpers
 * Centralized utilities for pagination, filtering, and common query patterns
 */

import { Response } from 'express';
import { prisma } from './prisma.js';
import type { PaginationParams, PaginationMeta } from '../types/index.js';

/**
 * Default pagination values
 */
export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

/**
 * Parse and validate pagination parameters from request query
 */
export function parsePagination(query: Record<string, unknown>): PaginationParams {
  let page = parseInt(query.page as string, 10) || DEFAULT_PAGE;
  let pageSize = parseInt((query.pageSize || query.limit) as string, 10) || DEFAULT_PAGE_SIZE;

  // Clamp values
  page = Math.max(1, page);
  pageSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE);

  const skip = (page - 1) * pageSize;

  return {
    page,
    pageSize,
    skip,
    take: pageSize,
    // Aliases for compatibility
    limit: pageSize,
    offset: skip
  };
}

/**
 * Build pagination response metadata
 */
export function buildPaginationMeta(total: number, page: number, pageSize: number): PaginationMeta {
  const totalPages = Math.ceil(total / pageSize);
  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
}

/**
 * Build response with pagination metadata
 */
export function paginatedResponse<T>(data: T[], total: number, { page, pageSize }: { page: number; pageSize: number }) {
  return {
    data,
    pagination: buildPaginationMeta(total, page, pageSize)
  };
}

/**
 * Build a search filter for text fields using case-insensitive contains
 */
export function buildSearchFilter(searchTerm: string | undefined, fields: string[]) {
  if (!searchTerm || !fields.length) return null;

  return {
    OR: fields.map(field => ({
      [field]: { contains: searchTerm, mode: 'insensitive' as const }
    }))
  };
}

/**
 * Build date range filter
 */
export function buildDateRangeFilter(field: string, startDate?: string, endDate?: string) {
  if (!startDate && !endDate) return null;

  const conditions: { gte?: Date; lte?: Date } = {};
  if (startDate) {
    conditions.gte = new Date(startDate);
  }
  if (endDate) {
    conditions.lte = new Date(endDate);
  }

  return { [field]: conditions };
}

/**
 * Build numeric range filter
 */
export function buildRangeFilter(field: string, min?: number, max?: number) {
  if (min === undefined && max === undefined) return null;

  const conditions: { gte?: number; lte?: number } = {};
  if (min !== undefined) {
    conditions.gte = min;
  }
  if (max !== undefined) {
    conditions.lte = max;
  }

  return { [field]: conditions };
}

/**
 * Merge multiple where clauses into one
 */
export function mergeWhere(...clauses: (Record<string, unknown> | null | undefined)[]) {
  const validClauses = clauses.filter(c => c && Object.keys(c).length > 0) as Record<string, unknown>[];
  if (validClauses.length === 0) return {};
  if (validClauses.length === 1) return validClauses[0];
  return { AND: validClauses };
}

/**
 * Standard select for user (excludes password)
 */
export const USER_SAFE_SELECT = {
  user_id: true,
  auth_id: true,
  first_name: true,
  last_name: true,
  email: true,
  contact_no: true,
  created_at: true,
  updated_at: true
};

interface PrismaError extends Error {
  code?: string;
  meta?: { target?: string | string[] };
}

/**
 * Handle Prisma errors and convert to appropriate HTTP response
 */
export function handlePrismaError(error: unknown, res: Response, context = 'Database operation') {
  console.error(`${context} error:`, error);

  const prismaError = error as PrismaError;
  const code = prismaError.code;

  // Connection errors
  if (code === 'P1001' || code === 'P1002' || code === 'P1003' || code === 'P1008' || code === 'P1017') {
    return res.status(503).json({
      error: 'Service temporarily unavailable',
      message: 'Database connection failed. Please try again later.',
      code: 'CONNECTION_ERROR'
    });
  }

  // Unique constraint violation
  if (code === 'P2002') {
    const target = prismaError.meta?.target;
    return res.status(409).json({
      error: 'Duplicate entry',
      message: 'A record with this value already exists.',
      fields: Array.isArray(target) ? target : [target]
    });
  }

  // Foreign key constraint
  if (code === 'P2003') {
    return res.status(400).json({
      error: 'Reference error',
      message: 'Referenced record does not exist.'
    });
  }

  // Record not found
  if (code === 'P2025') {
    return res.status(404).json({
      error: 'Not found',
      message: 'The requested record was not found.'
    });
  }

  // Validation / input errors
  if (code === 'P2000' || code === 'P2005' || code === 'P2006' || code === 'P2007') {
    return res.status(400).json({
      error: 'Validation error',
      message: prismaError.message || 'Invalid input data.'
    });
  }

  // Default server error
  return res.status(500).json({
    error: 'Internal server error',
    message: 'An unexpected error occurred.'
  });
}

/**
 * Wrap async route handlers to catch errors
 */
export function asyncHandler<T>(fn: (req: T, res: Response, next: () => void) => Promise<unknown>) {
  return (req: T, res: Response, next: () => void) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Execute with retry for transient failures
 * Optimized for faster failure detection with shorter delays
 */
export async function executeWithRetry<T>(queryFn: () => Promise<T>, retries = 2): Promise<T> {
  const RETRY_DELAY_MS = 500; // Reduced from 2000ms for faster response
  let lastError: unknown;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await queryFn();
    } catch (error) {
      lastError = error;
      const prismaError = error as PrismaError;
      const isTransient = 
        prismaError.code === 'P1001' || // Can't reach database
        prismaError.code === 'P1002' || // Database server timed out
        prismaError.code === 'P1008' || // Operations timed out
        prismaError.code === 'P1017' || // Server closed connection
        prismaError.message?.includes('ECONNRESET') ||
        prismaError.message?.includes('ECONNREFUSED');
      
      if (!isTransient || attempt >= retries) {
        throw error;
      }
      
      console.warn(`Transient DB error (attempt ${attempt}/${retries}):`, prismaError.message);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt));
    }
  }
  throw lastError;
}

/**
 * Execute query with a timeout wrapper
 * Returns the result or throws if timeout is exceeded
 */
export async function executeWithTimeout<T>(
  queryFn: () => Promise<T>,
  timeoutMs = 8000
): Promise<T> {
  return Promise.race([
    queryFn(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('QUERY_TIMEOUT')), timeoutMs)
    )
  ]);
}

export { prisma };

export default {
  prisma,
  parsePagination,
  buildPaginationMeta,
  paginatedResponse,
  buildSearchFilter,
  buildDateRangeFilter,
  buildRangeFilter,
  mergeWhere,
  USER_SAFE_SELECT,
  handlePrismaError,
  asyncHandler,
  executeWithRetry,
  executeWithTimeout,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE
};

