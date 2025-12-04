/**
 * Shared Module
 * 
 * Re-exports all shared libraries, middleware, schemas, and types.
 * This provides a single entry point for shared functionality.
 * 
 * Usage:
 *   import { prisma, logger, authenticateToken } from '@/shared';
 */

// Library exports
export * from '../lib/prisma.js';
export * from '../lib/prismaHelpers.js';
export * from '../lib/cache.js';
export * from '../lib/redisClient.js';
export * from '../lib/logger.js';
export * from '../lib/supabase.js';

// Middleware exports
export {
  authenticateToken,
  requireGoogleAuth,
  authenticateApiKey,
} from '../middleware/auth.js';
export { errorHandler } from '../middleware/errorHandler.js';
export { requireBusinessOwnership, requirePlanOwnership, requireActivityAccess } from '../middleware/ownership.js';
export { requestLogger, minimalRequestLogger, debugRequestLogger } from '../middleware/requestLogger.js';
export { mapRateLimiter, createMapRateLimiter } from '../middleware/rateLimiter.js';

// Schema exports
export * from '../schemas/validation.js';
export * from '../schemas/blogSchemas.js';

// Type exports
export * from '../types/index.js';

