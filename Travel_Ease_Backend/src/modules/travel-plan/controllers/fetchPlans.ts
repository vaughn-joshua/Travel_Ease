import { prisma, executeWithRetry, handlePrismaError } from "../../../lib/prismaHelpers.js";
import { parsePagination, buildPlanFilters, paginatedResponse } from "../utils/pagination.js";
import { formatPlan } from "../utils/formatPlan.js";
import { Request, Response } from "express";

/**
 * Fetch UPCOMING plans for the authenticated user:
 * - Draft plans (being prepared, regardless of date)
 * - Active plans with start_date in the FUTURE (not yet started)
 * 
 * Plans that are Active with start_date <= today should NOT appear here
 * (those belong in ongoing_plans)
 */
export async function fetch_plans(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const { page, pageSize, skip, take } = parsePagination(req.query as Record<string, string>);
    const filters = buildPlanFilters(req.query as Record<string, string>);

    // Get today's date at start of day (UTC) for consistent comparison
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Single query to get plan IDs where user is owner OR participant
    // Note: Table names use lowercase with @@map in Prisma schema
    const userPlanAccess = await executeWithRetry(() =>
      prisma.$queryRaw<{ travel_plan_id: number }[]>`
        SELECT DISTINCT tp.travel_plan_id 
        FROM "travel_plan" tp
        LEFT JOIN "participant" p ON tp.travel_plan_id = p.travel_plan_id AND p.user_id = ${userId} AND p.status = true
        WHERE tp.user_id = ${userId} OR p.participant_id IS NOT NULL
      `
    );
    const accessiblePlanIds = userPlanAccess.map(p => p.travel_plan_id);

    if (accessiblePlanIds.length === 0) {
      return res.json(paginatedResponse([], 0, { page, pageSize }));
    }

    // Build where clause for UPCOMING plans
    const where: any = {
      travel_plan_id: { in: accessiblePlanIds },
      OR: [
        // Draft plans - always upcoming regardless of date
        { status: 'Draft' },
        // Active plans with future start date only
        {
          status: 'Active',
          start_date: { gt: today }
        }
      ],
      // Apply any additional filters
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
    console.error("Error fetching upcoming plans:", error);
    return handlePrismaError(error, res, 'Fetching upcoming plans');
  }
}

