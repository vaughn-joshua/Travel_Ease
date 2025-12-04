import {
  prisma,
  executeWithRetry,
  handlePrismaError,
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
 * Fetch public plans (visibility=true, not expired)
 * Read-only listing; joining requires auth
 * Supports pagination and filtering
 *
 * Cache key: travel_plans:public:<page>:<pageSize>:<filters>
 * TTL: 30 seconds
 * Clear cache: Use invalidateCachePattern('travel_plans:public:') after plan create/update/delete
 */
export async function public_plans(req: Request, res: Response) {
  try {
    const { page, pageSize, skip, take } = parsePagination(
      req.query as Record<string, string>
    );
    const filters = buildPlanFilters(req.query as Record<string, string>);

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

        const [plans, total] = await executeWithRetry(() =>
          Promise.all([
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
            prisma.travelPlan.count({ where }),
          ])
        );

        // Get participant counts for each plan
        const planIdList = plans.map((p) => p.travel_plan_id);
        const participantCounts =
          planIdList.length > 0
            ? await executeWithRetry(() =>
                prisma.participant.groupBy({
                  by: ["travel_plan_id"],
                  where: {
                    travel_plan_id: { in: planIdList },
                    status: true,
                  },
                  _count: { participant_id: true },
                })
              )
            : [];

        const countMap: Record<number, number> = {};
        participantCounts.forEach((c) => {
          if (c.travel_plan_id !== null) {
            countMap[c.travel_plan_id] = c._count.participant_id;
          }
        });

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
    res.json(
      paginatedResponse(result.data, result.total, {
        page: result.page,
        pageSize: result.pageSize,
      })
    );
  } catch (error) {
    logger.error({ err: error }, "Error fetching public plans");
    return handlePrismaError(error, res, "Fetching public plans");
  }
}

