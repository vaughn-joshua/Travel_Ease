import {
  prisma,
  executeWithRetry,
  isDbConnectionError,
} from "../../../lib/prismaHelpers.js";
import { buildPlanFilters } from "../utils/pagination.js";
import { formatPlan } from "../utils/formatPlan.js";
import { logger } from "../../../lib/logger.js";
import { cacheResult, buildCacheKey, invalidateCachePattern } from "../../../lib/cache.js";
import { Request, Response } from "express";

// Cache TTL for grouped plans (120 seconds — safe because cache is
// invalidated on create/edit/delete via invalidateGroupedPlansCache)
const CACHE_TTL_GROUPED = 120;

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
  const cacheKey = buildCacheKey('travel_plans', 'all', userId, filters as any);

  try {
    const { data: cachedResult, fromCache, cacheBackend } = await cacheResult({
      key: cacheKey,
      ttl: CACHE_TTL_GROUPED,
      fetchFn: async () => {
        // All DB work in a single transaction to avoid multiple
        // BEGIN/DEALLOCATE ALL/COMMIT cycles (~800ms saved on remote DB)
        const { allPlans, participantCounts, accommodations } = await executeWithRetry(() =>
          prisma.$transaction(async (tx) => {
            // Step 1: Get all plan IDs where user is owner OR approved participant
            const userPlanAccess = await tx.$queryRaw<{ travel_plan_id: number }[]>`
              SELECT DISTINCT tp.travel_plan_id
              FROM "travel_plan" tp
              LEFT JOIN "participant" p ON tp.travel_plan_id = p.travel_plan_id
                AND p.user_id = ${userId}
                AND p.status = true
              WHERE tp.user_id = ${userId} OR p.participant_id IS NOT NULL
            `;

            const accessiblePlanIds = userPlanAccess.map(p => p.travel_plan_id);

            if (accessiblePlanIds.length === 0) {
              return { allPlans: [] as any[], participantCounts: [] as any[], accommodations: [] as any[] };
            }

            const where: any = {
              travel_plan_id: { in: accessiblePlanIds },
              ...filters,
            };

            // Step 2: Fetch plans + participant counts in parallel within the same transaction
            const [plans, counts] = await Promise.all([
              tx.travel_plan.findMany({
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
              tx.participant.groupBy({
                by: ['travel_plan_id'],
                where: {
                  travel_plan_id: { in: accessiblePlanIds },
                  status: true,
                },
                _count: { participant_id: true },
              }),
            ]);

            // Step 3: Fetch accommodations in the same transaction
            const planIds = plans.map(p => p.travel_plan_id);
            const accom = planIds.length > 0
              ? await tx.activity.findMany({
                  where: {
                    travel_plan_id: { in: planIds },
                    is_accommodation: true,
                  },
                  select: {
                    travel_plan_id: true,
                    business_id: true,
                    lat: true,
                    lng: true,
                    business: {
                      select: {
                        business_id: true,
                        name: true,
                        latitude: true,
                        longtitude: true,
                      },
                    },
                  },
                })
              : [];

            return { allPlans: plans, participantCounts: counts, accommodations: accom };
          }),
        1);

        if (allPlans.length === 0) {
          return {
            upcoming: { data: [], total: 0 },
            ongoing: { data: [], total: 0 },
            previous: { data: [], total: 0 },
          };
        }

        // Build participant count map
        const countMap: Record<number, number> = {};
        participantCounts.forEach((c) => {
          if (c.travel_plan_id !== null) {
            countMap[c.travel_plan_id] = c._count.participant_id;
          }
        });

        // Build accommodation map
        const accommodationMap = new Map<number, any>();
        allPlans.forEach(p => accommodationMap.set(p.travel_plan_id, null));
        accommodations.forEach((acc) => {
          if (acc.business && acc.travel_plan_id !== null) {
            const lat = acc.lat ?? acc.business.latitude;
            const lng = acc.lng ?? acc.business.longtitude;
            accommodationMap.set(acc.travel_plan_id, {
              business_id: acc.business.business_id,
              name: acc.business.name,
              lat: lat ? Number(lat) : null,
              lng: lng ? Number(lng) : null,
            });
          }
        });

        // Step 4: Group plans by status
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
