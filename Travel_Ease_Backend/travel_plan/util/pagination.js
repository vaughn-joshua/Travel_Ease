/**
 * Common pagination and filtering utilities for travel plan listings
 */

/**
 * Parse pagination params from request query
 * @param {object} query - req.query object
 * @returns {object} - { page, pageSize, skip }
 */
export function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(query.pageSize) || 20));
  const skip = (page - 1) * pageSize;
  return { page, pageSize, skip };
}

/**
 * Build common filter conditions for travel plans
 * @param {object} query - req.query object
 * @returns {object} - Prisma where conditions
 */
export function buildPlanFilters(query) {
  const filters = {};

  // Search by name or description
  if (query.search) {
    filters.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } }
    ];
  }

  // Filter by location
  if (query.location) {
    filters.location = { contains: query.location, mode: 'insensitive' };
  }

  // Date range filters
  if (query.startDateFrom) {
    filters.start_date = { ...filters.start_date, gte: new Date(query.startDateFrom) };
  }
  if (query.startDateTo) {
    filters.start_date = { ...filters.start_date, lte: new Date(query.startDateTo) };
  }
  if (query.endDateFrom) {
    filters.end_date = { ...filters.end_date, gte: new Date(query.endDateFrom) };
  }
  if (query.endDateTo) {
    filters.end_date = { ...filters.end_date, lte: new Date(query.endDateTo) };
  }

  return filters;
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
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      hasNext: page * pageSize < total,
      hasPrev: page > 1
    }
  };
}

