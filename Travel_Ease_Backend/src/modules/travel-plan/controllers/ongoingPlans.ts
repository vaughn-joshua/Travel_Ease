import { prisma, executeWithRetry, isDbConnectionError } from "../../../lib/prismaHelpers.js";
import { parsePagination, buildPlanFilters, paginatedResponse } from "../utils/pagination.js";
import { formatPlan } from "../utils/formatPlan.js";
import { getAccommodationForPlans } from "../utils/getAccommodation.js";
import { logger } from "../../../lib/logger.js";
import { cacheResult, buildCacheKey, invalidateCachePattern } from "../../../lib/cache.js";
import { Request, Response } from "express";

// Cache TTL for ongoing plans (30 seconds - short for active plans)
const CACHE_TTL_ONGOING = 30;

/**
 * Fetch ONGOING plans for the authenticated user:
 * - Plans with status 'Active' where user is owner OR approved participant
 * 
 * DEGRADED MODE: Returns empty data with dbUnavailable=true when database is unreachable
 */
export async function ongoing_plan(req: Request, res: Response) {
  const { page, pageSize, skip, take } = parsePagination(req.query as Record<string, string>);
  
  // Empty fallback response for degraded mode
  const emptyResponse = {
    data: [],
    pagination: {
      page,
      pageSize,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    },
    dbUnavailable: true,
  };

  // Auth check
  if (!req.user) {
    logger.warn({ endpoint: 'ongoing_plan' }, 'Request without authenticated user');
    return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
  }
  
  const userId = req.user.id;
  const filters = buildPlanFilters(req.query as Record<string, string>);

  // Build cache key for this user's ongoing plans
  const cacheKey = buildCacheKey('travel_plans', 'ongoing', userId, { page, pageSize, ...filters });

  try {
    // Use caching to reduce database roundtrips
    const { data: cachedResult, fromCache, cacheBackend } = await cacheResult({
      key: cacheKey,
      ttl: CACHE_TTL_ONGOING,
      fetchFn: async () => {
        // Get plan IDs where user is owner OR approved participant
        let accessiblePlanIds: number[] = [];
        const userPlanAccess = await executeWithRetry(() =>
          prisma.$queryRaw<{ travel_plan_id: number }[]>`
            SELECT DISTINCT tp.travel_plan_id 
            FROM "travel_plan" tp
            LEFT JOIN "participant" p ON tp.travel_plan_id = p.travel_plan_id AND p.user_id = ${userId} AND p.status = true
            WHERE tp.user_id = ${userId} OR p.participant_id IS NOT NULL
          `,
        1);
        accessiblePlanIds = userPlanAccess.map(p => p.travel_plan_id);

        if (accessiblePlanIds.length === 0) {
          return { data: [], total: 0 };
        }

        // Build where clause for ONGOING plans (status = Active)
        const where: any = {
          travel_plan_id: { in: accessiblePlanIds },
          status: 'Active',
          ...filters
        };

        // Fetch plans and count in parallel
        const [plans, total] = await Promise.all([
          executeWithRetry(() =>
            prisma.travel_plan.findMany({
              where,
              select: {
                travel_plan_id: true,
                name: true,
                start_date: true,
                end_date: true,
                description: true,
                location: true,
                status: true,
                max_slots: true,
                visibility: true,
                _count: {
                  select: {
                    participant: {
                      where: { status: true }
                    }
                  }
                }
              },
              orderBy: [{ start_date: 'asc' }, { travel_plan_id: 'desc' }],
              skip,
              take
            }),
          1),
          executeWithRetry(() => prisma.travel_plan.count({ where }), 1),
        ]);

        // Fetch accommodation for all plans
        const planIds = plans.map(p => p.travel_plan_id);
        let accommodationMap = new Map<number, any>();
        if (planIds.length > 0) {
          try {
            accommodationMap = await getAccommodationForPlans(planIds);
          } catch (accommodationError) {
            logger.warn({ err: accommodationError }, 'Failed to fetch accommodation for ongoing plans');
          }
        }

        // Format response with participant count and accommodation included
        const data = plans.map(p => formatPlan(p, {
          approvedParticipants: p._count.participant,
          accommodation: accommodationMap.get(p.travel_plan_id) || null
        }));

        return { data, total };
      }
    });

    // Set cache headers for debugging
    res.set("X-Cache", fromCache ? `HIT:${cacheBackend}` : 'MISS');
    res.set("X-DB-Status", "connected");
    res.json(paginatedResponse(cachedResult.data, cachedResult.total, { page, pageSize }));
  } catch (error) {
    // Check if this is a database connection error
    if (isDbConnectionError(error)) {
      logger.warn({ err: error, userId, endpoint: 'ongoing_plan' }, 'Database unavailable - returning empty ongoing plans');
      res.set("X-DB-Status", "unavailable");
      res.set("X-Cache", "MISS");
      return res.json(emptyResponse);
    }

    // Log and return empty for other errors to maintain graceful degradation
    logger.error({ err: error, userId, endpoint: 'ongoing_plan' }, 'Error fetching ongoing plans');
    res.set("X-DB-Status", "error");
    res.set("X-Cache", "MISS");
    return res.json(emptyResponse);
  }
}

/**
 * Invalidate cached ongoing plans for a specific user
 * Call this when a user's plans are modified
 */
export async function invalidateOngoingPlansCache(userId: number): Promise<void> {
  await invalidateCachePattern(`travel_plans:ongoing:${userId}`);
}

