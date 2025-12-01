import { prisma, executeWithRetry, handlePrismaError } from "../../src/lib/prismaHelpers.js";
import { parsePagination, buildPlanFilters, paginatedResponse } from "../util/pagination.js";
import { formatPlan } from "../util/formatPlan.js";
import { Request, Response } from "express";

/**
 * Fetch ONGOING plans for the authenticated user:
 * - Active plans where start_date <= today (trip has started)
 * 
 * Active plans with future start_date should NOT appear here
 * (those belong in fetch_plans/upcoming)
 */
export async function ongoing_plan(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const { page, pageSize, skip, take } = parsePagination(req.query as Record<string, string>);
    const filters = buildPlanFilters(req.query as Record<string, string>);

    // Get today's date at start of day (UTC) for consistent comparison
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Single query to get plan IDs where user is owner OR participant
    const userPlanAccess = await executeWithRetry(() =>
      prisma.$queryRaw<{ travel_plan_id: number }[]>`
        SELECT DISTINCT tp.travel_plan_id 
        FROM "TravelPlan" tp
        LEFT JOIN "Participant" p ON tp.travel_plan_id = p.travel_plan_id AND p.user_id = ${userId} AND p.status = true
        WHERE tp.user_id = ${userId} OR p.participant_id IS NOT NULL
      `
    );
    const accessiblePlanIds = userPlanAccess.map(p => p.travel_plan_id);

    if (accessiblePlanIds.length === 0) {
      return res.json(paginatedResponse([], 0, { page, pageSize }));
    }

    // Build where clause for ONGOING plans:
    // Active status AND start_date has passed (or is today)
    const where: any = {
      travel_plan_id: { in: accessiblePlanIds },
      status: 'Active',
      // Only include if start_date is today or in the past
      OR: [
        { start_date: { lte: today } },
        { start_date: null } // Include Active plans without a start_date
      ],
      ...filters
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
            status: true,
            max_slots: true,
            visibility: true,
            _count: {
              select: {
                participants: {
                  where: { status: true }
                }
              }
            }
          },
          orderBy: [{ start_date: 'asc' }, { travel_plan_id: 'desc' }],
          skip,
          take
        }),
        prisma.travelPlan.count({ where })
      ])
    );

    // Format response with participant count included
    const data = plans.map(p => formatPlan(p, {
      approvedParticipants: p._count.participants
    }));

    res.json(paginatedResponse(data, total, { page, pageSize }));
  } catch (error) {
    console.error("Error fetching ongoing plans:", error);
    return handlePrismaError(error, res, 'Fetching ongoing plans');
  }
}
