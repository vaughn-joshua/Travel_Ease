import {
  prisma,
  executeWithRetry,
  isDbConnectionError,
} from "../../../lib/prismaHelpers.js";
import { buildPlanFilters } from "../utils/pagination.js";
import { formatPlan } from "../utils/formatPlan.js";
import { getAccommodationForPlans } from "../utils/getAccommodation.js";
import { logger } from "../../../lib/logger.js";
import { cacheResult, buildCacheKey, invalidateCachePattern } from "../../../lib/cache.js";
import { Request, Response } from "express";

// Cache TTL for grouped plans (30 seconds)
const CACHE_TTL_GROUPED = 30;

// Status grouping mapping
const STATUS_GROUPS = {
  Draft: 'upcoming',
  Active: 'ongoing',
  Completed: 'previous',
  Cancelled: 'previous',
} as const;

type StatusGroup = 'upcoming' | 'ongoing' | 'previous';

interface GroupedPlansData {
  upcoming: any[];
  ongoing: any[];
  previous: any[];
}

interface GroupedCounts {
  upcoming: number;
  ongoing: number;
  previous: number;
}

/**
 * Fetch ALL plans for the authenticated user in a single query,
 * grouped by status: upcoming (Draft), ongoing (Active), previous (Completed/Cancelled)
 * 
 * This reduces multiple API calls to one, improving frontend performance.
 * 
 * DEGRADED MODE: Returns empty groups with dbUnavailable=true when database is unreachable
 */
export async function all_plans(req: Request, res: Response) {
  // Empty fallback response for degraded mode
  const emptyResponse = {
    upcoming: { data: [], total: 0 },
    ongoing: { data: [], total: 0 },
    previous: { data: [], total: 0 },
    dbUnavailable: true,
  };

  // Auth check
  if (!req.user) {
    logger.warn({ endpoint: 'all_plans' }, 'Request without authenticated user');
    return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
  }

  const userId = req.user.id;
  const filters = buildPlanFilters(req.query as Record<string, string>);

  // Build cache key for this user's grouped plans
  const cacheKey = buildCacheKey('travel_plans', 'all', userId, filters);

  try {
    const { data: cachedResult, fromCache, cacheBackend } = await cacheResult({
      key: cacheKey,
      ttl: CACHE_TTL_GROUPED,
      fetchFn: async () => {
        // Step 1: Get all plan IDs where user is owner OR approved participant
        const userPlanAccess = await executeWithRetry(() =>
          prisma.$queryRaw<{ travel_plan_id: number }[]>`
            SELECT DISTINCT tp.travel_plan_id 
            FROM "travel_plan" tp
            LEFT JOIN "participant" p ON tp.travel_plan_id = p.travel_plan_id 
              AND p.user_id = ${userId} 
              AND p.status = true
            WHERE tp.user_id = ${userId} OR p.participant_id IS NOT NULL
          `,
        1);

        const accessiblePlanIds = userPlanAccess.map(p => p.travel_plan_id);

        if (accessiblePlanIds.length === 0) {
          return {
            upcoming: { data: [], total: 0 },
            ongoing: { data: [], total: 0 },
            previous: { data: [], total: 0 },
          };
        }

        // Step 2: Fetch ALL plans in a single query
        const where: any = {
          travel_plan_id: { in: accessiblePlanIds },
          ...filters,
        };

        const [allPlans, participantCounts] = await Promise.all([
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
                user_id: true,
              },
              orderBy: [{ start_date: 'asc' }, { travel_plan_id: 'desc' }],
            }),
          1),
          // Get participant counts for all accessible plans
          executeWithRetry(() =>
            prisma.participant.groupBy({
              by: ['travel_plan_id'],
              where: {
                travel_plan_id: { in: accessiblePlanIds },
                status: true,
              },
              _count: { participant_id: true },
            }),
          1),
        ]);

        // Build participant count map
        const countMap: Record<number, number> = {};
        participantCounts.forEach((c) => {
          if (c.travel_plan_id !== null) {
            countMap[c.travel_plan_id] = c._count.participant_id;
          }
        });

        // Fetch accommodation for all plans
        const planIds = allPlans.map(p => p.travel_plan_id);
        let accommodationMap = new Map<number, any>();
        if (planIds.length > 0) {
          try {
            accommodationMap = await getAccommodationForPlans(planIds);
          } catch (err) {
            logger.warn({ err }, 'Failed to fetch accommodation for grouped plans');
          }
        }

        // Step 3: Group plans by status
        const grouped: GroupedPlansData = {
          upcoming: [],
          ongoing: [],
          previous: [],
        };

        const counts: GroupedCounts = {
          upcoming: 0,
          ongoing: 0,
          previous: 0,
        };

        allPlans.forEach((plan) => {
          const status = plan.status as keyof typeof STATUS_GROUPS;
          const group = STATUS_GROUPS[status] || 'previous';
          
          const formattedPlan = formatPlan(plan, {
            approvedParticipants: countMap[plan.travel_plan_id] || 0,
            accommodation: accommodationMap.get(plan.travel_plan_id) || null,
          });

          grouped[group].push(formattedPlan);
          counts[group]++;
        });

        return {
          upcoming: { data: grouped.upcoming, total: counts.upcoming },
          ongoing: { data: grouped.ongoing, total: counts.ongoing },
          previous: { data: grouped.previous, total: counts.previous },
        };
      },
    });

    // Set cache headers for debugging
    res.set("X-Cache", fromCache ? `HIT:${cacheBackend}` : 'MISS');
    res.set("X-DB-Status", "connected");
    res.json(cachedResult);
  } catch (error) {
    // Check if this is a database connection error
    if (isDbConnectionError(error)) {
      logger.warn({ err: error, userId, endpoint: 'all_plans' }, 'Database unavailable - returning empty grouped plans');
      res.set("X-DB-Status", "unavailable");
      res.set("X-Cache", "MISS");
      return res.json(emptyResponse);
    }

    // Log and return empty for other errors to maintain graceful degradation
    logger.error({ err: error, userId, endpoint: 'all_plans' }, 'Error fetching grouped plans');
    res.set("X-DB-Status", "error");
    res.set("X-Cache", "MISS");
    return res.json(emptyResponse);
  }
}

/**
 * Invalidate cached grouped plans for a specific user
 * Call this when a user's plans are modified
 */
export async function invalidateGroupedPlansCache(userId: number): Promise<void> {
  await invalidateCachePattern(`travel_plans:all:${userId}`);
}
