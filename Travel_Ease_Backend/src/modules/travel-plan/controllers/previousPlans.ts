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
import { logger } from "../../../lib/logger.js";
import { Request, Response } from "express";

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
 * Fetch previous (Completed or Cancelled) plans for the authenticated user
 * Supports pagination and filtering via query params:
 * - status: 'Completed' | 'Cancelled' (defaults to both)
 * 
 * DEGRADED MODE: Returns empty data with dbUnavailable=true when database is unreachable
 */
export async function previous_plans(req: Request, res: Response) {
  const userId = req.user!.id;
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
    // Allow filtering by specific status (Completed or Cancelled)
    const statusFilter = req.query.status as string | undefined;
    const validStatuses = ["Completed", "Cancelled"];
    const statuses =
      statusFilter && validStatuses.includes(statusFilter)
        ? [statusFilter]
        : validStatuses;

    // Get plan IDs where user is a participant
    let planIds: number[] = [];
    try {
      const participantPlanIds = await executeWithRetry(() =>
        prisma.participant.findMany({
          where: { user_id: userId },
          select: { travel_plan_id: true },
        }),
      1);
      planIds = participantPlanIds
        .map((p) => p.travel_plan_id)
        .filter((id): id is number => id !== null);
    } catch (participantError) {
      if (isDbConnectionError(participantError)) {
        logger.warn({ err: participantError }, 'Database unavailable - returning empty previous plans');
        res.set("X-DB-Status", "unavailable");
        return res.json(emptyResponse);
      }
      throw participantError;
    }

    // Build where clause: user is owner or participant
    const where: any = {
      status: { in: statuses },
      OR: [
        { user_id: userId },
        ...(planIds.length > 0 ? [{ travel_plan_id: { in: planIds } }] : []),
      ],
      ...filters,
    };

    // Use Promise.allSettled for graceful partial failure handling
    const results = await Promise.allSettled([
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
          },
          orderBy: [{ end_date: "desc" }],
          skip,
          take,
        }),
      1),
      executeWithRetry(() => prisma.travel_plan.count({ where }), 1),
    ]);

    // Extract results, using empty/zero for failed queries
    const plans = results[0].status === 'fulfilled' ? results[0].value : [];
    const total = results[1].status === 'fulfilled' ? results[1].value : 0;

    // Check if both queries failed
    const allFailed = results.every(r => r.status === 'rejected');
    if (allFailed) {
      const firstError = (results[0] as PromiseRejectedResult).reason;
      if (isDbConnectionError(firstError)) {
        logger.warn({ err: firstError }, 'Database unavailable - returning empty previous plans');
        res.set("X-DB-Status", "unavailable");
        return res.json(emptyResponse);
      }
      throw firstError;
    }

    // Get participant counts for each plan
    const planIdList = plans.map((p) => p.travel_plan_id);
    let countMap: Record<number, number> = {};

    if (planIdList.length > 0) {
      try {
        const participantCounts = await executeWithRetry(() =>
          prisma.participant.groupBy({
            by: ["travel_plan_id"],
            where: { travel_plan_id: { in: planIdList } },
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
        logger.warn({ err: countError }, 'Failed to fetch participant counts for previous plans');
      }
    }

    const data = plans.map((p) =>
      formatPlan(p, {
        participantCount: countMap[p.travel_plan_id] || 0,
        approvedParticipants: countMap[p.travel_plan_id] || 0,
      })
    );

    res.set("X-DB-Status", "connected");
    res.json(paginatedResponse(data, total, { page, pageSize }));
  } catch (error) {
    // Check if this is a database connection error
    if (isDbConnectionError(error)) {
      logger.warn({ err: error }, 'Database unavailable - returning empty previous plans');
      res.set("X-DB-Status", "unavailable");
      return res.json(emptyResponse);
    }

    // Log and return empty for other errors to maintain graceful degradation
    logger.error({ err: error }, "Error fetching previous plans");
    res.set("X-DB-Status", "error");
    return res.json(emptyResponse);
  }
}

