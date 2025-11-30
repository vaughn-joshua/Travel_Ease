/**
 * Sequelize Query Helpers
 * Centralized utilities for pagination, filtering, and common query patterns
 */

import { Op } from 'sequelize';

/**
 * Default pagination values
 */
export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

/**
 * Parse and validate pagination parameters from request query
 * @param {object} query - Request query object
 * @returns {object} - { page, pageSize, limit, offset }
 */
export function parsePagination(query) {
  let page = parseInt(query.page, 10) || DEFAULT_PAGE;
  let pageSize = parseInt(query.pageSize || query.limit, 10) || DEFAULT_PAGE_SIZE;

  // Clamp values
  page = Math.max(1, page);
  pageSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE);

  const offset = (page - 1) * pageSize;

  return {
    page,
    pageSize,
    limit: pageSize,
    offset
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
 * Build a search filter for text fields using ILIKE
 * @param {string} searchTerm - Search term
 * @param {string[]} fields - Field names to search
 * @returns {object|null} - Sequelize where clause or null
 */
export function buildSearchFilter(searchTerm, fields) {
  if (!searchTerm || !fields.length) return null;

  const term = `%${searchTerm}%`;
  return {
    [Op.or]: fields.map(field => ({
      [field]: { [Op.iLike]: term }
    }))
  };
}

/**
 * Build date range filter
 * @param {string} field - Field name
 * @param {string} startDate - Start date (inclusive)
 * @param {string} endDate - End date (inclusive)
 * @returns {object|null} - Sequelize where clause or null
 */
export function buildDateRangeFilter(field, startDate, endDate) {
  if (!startDate && !endDate) return null;

  const conditions = {};
  if (startDate) {
    conditions[Op.gte] = new Date(startDate);
  }
  if (endDate) {
    conditions[Op.lte] = new Date(endDate);
  }

  return { [field]: conditions };
}

/**
 * Build numeric range filter
 * @param {string} field - Field name
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (inclusive)
 * @returns {object|null} - Sequelize where clause or null
 */
export function buildRangeFilter(field, min, max) {
  if (min === undefined && max === undefined) return null;

  const conditions = {};
  if (min !== undefined) {
    conditions[Op.gte] = min;
  }
  if (max !== undefined) {
    conditions[Op.lte] = max;
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
  return { [Op.and]: validClauses };
}

/**
 * Standard attributes for user selection (excludes password)
 */
export const USER_SAFE_ATTRIBUTES = [
  'user_id',
  'auth_id',
  'first_name',
  'last_name',
  'email',
  'contact_no',
  'created_at',
  'updated_at'
];

/**
 * Handle Sequelize errors and convert to appropriate HTTP response
 * @param {Error} error - Sequelize error
 * @param {Response} res - Express response
 * @param {string} context - Context for logging
 */
export function handleSequelizeError(error, res, context = 'Database operation') {
  console.error(`${context} error:`, error);

  // Connection errors
  if (error.name === 'SequelizeConnectionError' ||
      error.name === 'SequelizeConnectionRefusedError' ||
      error.name === 'SequelizeHostNotFoundError' ||
      error.name === 'SequelizeConnectionTimedOutError') {
    return res.status(503).json({
      error: 'Service temporarily unavailable',
      message: 'Database connection failed. Please try again later.',
      code: 'CONNECTION_ERROR'
    });
  }

  // Validation errors
  if (error.name === 'SequelizeValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      details: error.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  // Unique constraint violation
  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      error: 'Duplicate entry',
      message: 'A record with this value already exists.',
      fields: error.errors.map(e => e.path)
    });
  }

  // Foreign key constraint
  if (error.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      error: 'Reference error',
      message: 'Referenced record does not exist.'
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

export default {
  parsePagination,
  buildPaginationMeta,
  buildSearchFilter,
  buildDateRangeFilter,
  buildRangeFilter,
  mergeWhere,
  USER_SAFE_ATTRIBUTES,
  handleSequelizeError,
  asyncHandler,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE
};

