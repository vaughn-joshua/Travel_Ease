/**
 * Common pagination and filtering utilities for travel plan listings
 * Updated for Sequelize ORM
 */

import { Op } from 'sequelize';

/**
 * Parse pagination params from request query
 * @param {object} query - req.query object
 * @returns {object} - { page, pageSize, skip, limit, offset }
 */
export function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(query.pageSize) || 20));
  const skip = (page - 1) * pageSize;
  return { 
    page, 
    pageSize, 
    skip,
    limit: pageSize,
    offset: skip
  };
}

/**
 * Build common filter conditions for travel plans (Sequelize format)
 * @param {object} query - req.query object
 * @returns {object} - Sequelize where conditions
 */
export function buildPlanFilters(query) {
  const filters = {};

  // Search by name or description
  if (query.search) {
    filters[Op.or] = [
      { name: { [Op.iLike]: `%${query.search}%` } },
      { description: { [Op.iLike]: `%${query.search}%` } }
    ];
  }

  // Filter by location
  if (query.location) {
    filters.location = { [Op.iLike]: `%${query.location}%` };
  }

  // Date range filters
  if (query.startDateFrom || query.startDateTo) {
    filters.start_date = {};
    if (query.startDateFrom) {
      filters.start_date[Op.gte] = new Date(query.startDateFrom);
    }
    if (query.startDateTo) {
      filters.start_date[Op.lte] = new Date(query.startDateTo);
    }
  }
  
  if (query.endDateFrom || query.endDateTo) {
    filters.end_date = {};
    if (query.endDateFrom) {
      filters.end_date[Op.gte] = new Date(query.endDateFrom);
    }
    if (query.endDateTo) {
      filters.end_date[Op.lte] = new Date(query.endDateTo);
    }
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
