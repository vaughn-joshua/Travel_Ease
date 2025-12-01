/**
 * Prisma Query Helpers
 * Centralized utilities for pagination, filtering, and common query patterns
 */

import { prisma } from './prisma.js';

/**
 * Default pagination values
 */
export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

/**
 * Parse and validate pagination parameters from request query
 * @param {object} query - Request query object
 * @returns {object} - { page, pageSize, skip, take }
 */
export function parsePagination(query) {
  let page = parseInt(query.page, 10) || DEFAULT_PAGE;
  let pageSize = parseInt(query.pageSize || query.limit, 10) || DEFAULT_PAGE_SIZE;

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
 * @param {number} total - Total count of records
 * @param {number} page - Current page
 * @param {number} pageSize - Items per page
 * @returns {object} - Pagination metadata
 */
export function buildPaginationMeta(total, page, pageSize) {
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
 * @param {Array} data - Query results
 * @param {number} total - Total count
 * @param {object} pagination - { page, pageSize }
 * @returns {object} - Response with data and pagination info
 */
export function paginatedResponse(data, total, { page, pageSize }) {
  return {
    data,
    pagination: buildPaginationMeta(total, page, pageSize)
  };
}

/**
 * Build a search filter for text fields using case-insensitive contains
 * @param {string} searchTerm - Search term
 * @param {string[]} fields - Field names to search
 * @returns {object|null} - Prisma where clause or null
 */
export function buildSearchFilter(searchTerm, fields) {
  if (!searchTerm || !fields.length) return null;

  return {
    OR: fields.map(field => ({
      [field]: { contains: searchTerm, mode: 'insensitive' }
    }))
  };
}

/**
 * Build date range filter
 * @param {string} field - Field name
 * @param {string} startDate - Start date (inclusive)
 * @param {string} endDate - End date (inclusive)
 * @returns {object|null} - Prisma where clause or null
 */
export function buildDateRangeFilter(field, startDate, endDate) {
  if (!startDate && !endDate) return null;

  const conditions = {};
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
 * @param {string} field - Field name
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (inclusive)
 * @returns {object|null} - Prisma where clause or null
 */
export function buildRangeFilter(field, min, max) {
  if (min === undefined && max === undefined) return null;

  const conditions = {};
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
 * @param  {...object} clauses - Where clause objects
 * @returns {object} - Merged where clause
 */
export function mergeWhere(...clauses) {
  const validClauses = clauses.filter(c => c && Object.keys(c).length > 0);
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

/**
 * Handle Prisma errors and convert to appropriate HTTP response
 * @param {Error} error - Prisma error
 * @param {Response} res - Express response
 * @param {string} context - Context for logging
 */
export function handlePrismaError(error, res, context = 'Database operation') {
  console.error(`${context} error:`, error);

  // Prisma error codes: https://www.prisma.io/docs/reference/api-reference/error-reference
  const code = error.code;

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
    const target = error.meta?.target;
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
      message: error.message || 'Invalid input data.'
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
 * @param {Function} fn - Async route handler
 * @returns {Function} - Wrapped handler
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Execute with retry for transient failures
 * @param {Function} queryFn - Async function returning a Prisma query
 * @param {number} retries - Number of retries
 * @returns {Promise} - Query result
 */
export async function executeWithRetry(queryFn, retries = 3) {
  const RETRY_DELAY_MS = 2000;
  let lastError;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await queryFn();
    } catch (error) {
      lastError = error;
      const isTransient = 
        error.code === 'P1001' || // Can't reach database
        error.code === 'P1002' || // Database server timed out
        error.code === 'P1008' || // Operations timed out
        error.code === 'P1017' || // Server closed connection
        error.message?.includes('ECONNRESET') ||
        error.message?.includes('ECONNREFUSED');
      
      if (!isTransient || attempt >= retries) {
        throw error;
      }
      
      console.warn(`Transient DB error (attempt ${attempt}/${retries}):`, error.message);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt));
    }
  }
  throw lastError;
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
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE
};

