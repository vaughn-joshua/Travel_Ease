import {
  prisma,
  executeWithRetry,
  isDbConnectionError,
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
const PUBLIC_PLANS_CACHE_TTL = 60; // 60 seconds
const PARTICIPATION_CACHE_TTL = 30; // 30 seconds for user-specific participation

/**
 * Fetch public plans (visibility=true, not expired)
 * Read-only listing; joining requires auth
 * Supports pagination and filtering
 * If authenticated, includes user's participation status for each plan
 *
 * All DB queries are batched into a single transaction to minimize
 * round-trips to the remote database (~2000ms saved).
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
          status: { in: ["Draft", "Active"] },
          OR: [
            { visibility_end_date: null },
            { visibility_end_date: { gte: today } },
          ],
          ...filters,
        };

        // All DB work in a single transaction to avoid multiple
        // BEGIN/DEALLOCATE ALL/COMMIT cycles (~2000ms saved on remote DB)
        const { plans, total, participantCounts, accommodations } =
          await executeWithRetry(
            () =>
              prisma.$transaction(async (tx) => {
                // Fetch plans + count in parallel within the same transaction
                const [planRows, countResult] = await Promise.all([
                  tx.travel_plan.findMany({
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
                      user_id: true,
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
                  tx.travel_plan.count({ where }),
                ]);

                const planIdList = planRows.map((p) => p.travel_plan_id);

                // Fetch participant counts + accommodations in parallel
                const [counts, accom] =
                  planIdList.length > 0
                    ? await Promise.all([
                        tx.participant.groupBy({
                          by: ["travel_plan_id"],
                          where: {
                            travel_plan_id: { in: planIdList },
                            status: true,
                          },
                          _count: { participant_id: true },
                        }),
                        tx.activity.findMany({
                          where: {
                            travel_plan_id: { in: planIdList },
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
                        }),
                      ])
                    : [[], []];

                return {
                  plans: planRows,
                  total: countResult,
                  participantCounts: counts,
                  accommodations: accom,
                };
              }),
            1
          );

        // Build participant count map
        const countMap: Record<number, number> = {};
        participantCounts.forEach((c) => {
          if (c.travel_plan_id !== null) {
            countMap[c.travel_plan_id] = c._count.participant_id;
          }
        });

        // Build accommodation map
        const accommodationMap = new Map<number, any>();
        plans.forEach((p) => accommodationMap.set(p.travel_plan_id, null));
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

        // Format plans with slot availability
        const data = plans.map((p) => {
          const approvedCount = countMap[p.travel_plan_id] || 0;
          return formatPlan(p, {
            approvedParticipants: approvedCount,
            slotsAvailable: p.max_slots ? p.max_slots - approvedCount : null,
            accommodation: accommodationMap.get(p.travel_plan_id) || null,
          });
        });

        return { data, total, page, pageSize };
      },
    });

    // If user is authenticated, add participation info (cached per user)
    let dataWithParticipation = result.data;
    if (req.user?.id && result.data.length > 0) {
      const planIdList = result.data.map(
        (p: any) => p.id || p.travel_plan_id
      );

      // Check if user is owner of any plans (from cached data, no DB call)
      const ownershipMap: Record<number, boolean> = {};
      result.data.forEach((p: any) => {
        const planId = p.id || p.travel_plan_id;
        ownershipMap[planId] = p.user_id === req.user!.id;
      });

      // Cache the participation check per user
      const { data: userParticipants } = await cacheResult({
        key: buildCacheKey(
          "travel_plans",
          "participation",
          req.user.id,
          { plans: planIdList }
        ),
        ttl: PARTICIPATION_CACHE_TTL,
        fetchFn: () =>
          executeWithRetry(() =>
            prisma.participant.findMany({
              where: {
                travel_plan_id: { in: planIdList },
                user_id: req.user!.id,
                status: true,
              },
              select: { travel_plan_id: true, role: true },
            })
          ),
      });

      const participationMap: Record<
        number,
        { isParticipant: boolean; role: string }
      > = {};
      userParticipants.forEach((p) => {
        if (p.travel_plan_id !== null) {
          participationMap[p.travel_plan_id] = {
            isParticipant: true,
            role: p.role,
          };
        }
      });

      dataWithParticipation = result.data.map((plan: any) => {
        const planId = plan.id || plan.travel_plan_id;
        const isOwner = ownershipMap[planId] || false;
        const participation = participationMap[planId];
        return {
          ...plan,
          isOwner,
          isParticipant: isOwner || !!participation,
          participantRole: isOwner
            ? "Owner"
            : participation?.role || null,
        };
      });
    }

    // Set cache header for debugging
    res.set("X-Cache", fromCache ? `HIT:${cacheBackend}` : "MISS");
    res.set("X-DB-Status", "connected");
    res.json(
      paginatedResponse(dataWithParticipation, result.total, {
        page: result.page,
        pageSize: result.pageSize,
      })
    );
  } catch (error) {
    // Check if this is a database connection error
    if (isDbConnectionError(error)) {
      logger.warn(
        { err: error },
        "Database unavailable - returning empty public plans"
      );
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
