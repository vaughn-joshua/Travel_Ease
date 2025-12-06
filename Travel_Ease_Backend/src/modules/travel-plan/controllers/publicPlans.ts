import {
  prisma,
  executeWithRetry,
} from "../../../lib/prismaHelpers.js";
import {
  parsePagination,
  buildPlanFilters,
  paginatedResponse,
} from "../utils/pagination.js";
import { formatPlan } from "../utils/formatPlan.js";
import { cacheResult, buildCacheKey } from "../../../lib/cache.js";
import { logger } from "../../../lib/logger.js";
import { Request, Response } from "express";

// Cache TTL (in seconds)
const PUBLIC_PLANS_CACHE_TTL = 30; // 30 seconds - plans change frequently with joins

/**
 * Check if error is a database connection error
 */
function isDbConnectionError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message || '';
    const prismaError = error as { code?: string };
    return (
      prismaError.code === 'P1001' || // Can't reach database
      prismaError.code === 'P1002' || // Database server timed out
      prismaError.code === 'P1008' || // Operations timed out
      prismaError.code === 'P1017' || // Server closed connection
      message.includes("Can't reach database") ||
      message.includes('Connection refused') ||
      message.includes('ECONNREFUSED') ||
      message.includes('ECONNRESET')
    );
  }
  return false;
}

/**
 * Fetch public plans (visibility=true, not expired)
 * Read-only listing; joining requires auth
 * Supports pagination and filtering
 *
 * Cache key: travel_plans:public:<page>:<pageSize>:<filters>
 * TTL: 30 seconds
 * Clear cache: Use invalidateCachePattern('travel_plans:public:') after plan create/update/delete
 * 
 * DEGRADED MODE: Returns empty data with dbUnavailable=true when database is unreachable
 */
export async function public_plans(req: Request, res: Response) {
  const { page, pageSize, skip, take } = parsePagination(
    req.query as Record<string, string>
  );
  const filters = buildPlanFilters(req.query as Record<string, string>);

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

  try {
    // Use Redis-backed cache with in-memory fallback
    const {
      data: result,
      fromCache,
      cacheBackend,
    } = await cacheResult({
      key: buildCacheKey("travel_plans", "public", {
        page,
        pageSize,
        ...filters,
      }),
      ttl: PUBLIC_PLANS_CACHE_TTL,
      fetchFn: async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const where: any = {
          visibility: true,
          status: { in: ["Draft", "Active"] }, // Only show joinable plans
          // Not expired: visibility_end_date is null or in the future
          OR: [
            { visibility_end_date: null },
            { visibility_end_date: { gte: today } },
          ],
          ...filters,
        };

        // Use Promise.allSettled for graceful partial failure handling
        const results = await Promise.allSettled([
          executeWithRetry(() =>
            prisma.travelPlan.findMany({
              where,
              select: {
                travel_plan_id: true,
                name: true,
                start_date: true,
                end_date: true,
                description: true,
                location: true,
                max_slots: true,
                visibility: true,
                visibility_timestamp: true,
                status: true,
                user: {
                  select: {
                    user_id: true,
                    first_name: true,
                    last_name: true,
                  },
                },
              },
              orderBy: [{ visibility_timestamp: "desc" }],
              skip,
              take,
            }),
          1), // Only 1 retry for faster response
          executeWithRetry(() => prisma.travelPlan.count({ where }), 1),
        ]);

        // Extract results, using empty/zero for failed queries
        const plans = results[0].status === 'fulfilled' ? results[0].value : [];
        const total = results[1].status === 'fulfilled' ? results[1].value : 0;

        // Check if both queries failed
        const allFailed = results.every(r => r.status === 'rejected');
        if (allFailed) {
          // Re-throw the first error to trigger degraded mode
          throw (results[0] as PromiseRejectedResult).reason;
        }

        // Get participant counts for each plan (if we have plans)
        const planIdList = plans.map((p) => p.travel_plan_id);
        let countMap: Record<number, number> = {};

        if (planIdList.length > 0) {
          try {
            const participantCounts = await executeWithRetry(() =>
              prisma.participant.groupBy({
                by: ["travel_plan_id"],
                where: {
                  travel_plan_id: { in: planIdList },
                  status: true,
                },
                _count: { participant_id: true },
              }),
            1);

            participantCounts.forEach((c) => {
              if (c.travel_plan_id !== null) {
                countMap[c.travel_plan_id] = c._count.participant_id;
              }
            });
          } catch (countError) {
            // Log but don't fail - counts are non-critical
            logger.warn({ err: countError }, 'Failed to fetch participant counts');
          }
        }

        // Add slot availability info with normalized DTO
        const data = plans.map((p) => {
          const approvedCount = countMap[p.travel_plan_id] || 0;
          return formatPlan(p, {
            approvedParticipants: approvedCount,
            slotsAvailable: p.max_slots ? p.max_slots - approvedCount : null,
          });
        });

        return { data, total, page, pageSize };
      },
    });

    // Set cache header for debugging
    res.set("X-Cache", fromCache ? `HIT:${cacheBackend}` : "MISS");
    res.set("X-DB-Status", "connected");
    res.json(
      paginatedResponse(result.data, result.total, {
        page: result.page,
        pageSize: result.pageSize,
      })
    );
  } catch (error) {
    // Check if this is a database connection error
    if (isDbConnectionError(error)) {
      logger.warn({ err: error }, 'Database unavailable - returning empty public plans');
      res.set("X-Cache", "MISS");
      res.set("X-DB-Status", "unavailable");
      return res.json(emptyResponse);
    }

    // Log and return empty for other errors to maintain graceful degradation
    logger.error({ err: error }, "Error fetching public plans");
    res.set("X-Cache", "MISS");
    res.set("X-DB-Status", "error");
    return res.json(emptyResponse);
  }
}

