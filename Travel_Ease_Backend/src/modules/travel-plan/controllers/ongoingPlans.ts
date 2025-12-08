import { prisma, executeWithRetry, handlePrismaError } from "../../../lib/prismaHelpers.js";
import { parsePagination, buildPlanFilters, paginatedResponse } from "../utils/pagination.js";
import { formatPlan } from "../utils/formatPlan.js";
import { getAccommodationForPlans } from "../utils/getAccommodation.js";
import { Request, Response } from "express";

/**
 * Fetch ONGOING plans for the authenticated user:
 * - ALL plans with status 'Active'
 */
export async function ongoing_plan(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const { page, pageSize, skip, take } = parsePagination(req.query as Record<string, string>);
    const filters = buildPlanFilters(req.query as Record<string, string>);

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

    // Build where clause for ONGOING plans:
    // All plans with Active status
    const where: any = {
      travel_plan_id: { in: accessiblePlanIds },
      status: 'Active',
      ...filters
    };

    const [plans, total] = await executeWithRetry(() =>
      Promise.all([
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
        prisma.travel_plan.count({ where })
      ])
    );

    // Fetch accommodation for all plans
    const planIds = plans.map(p => p.travel_plan_id);
    const accommodationMap = await getAccommodationForPlans(planIds);

    // Format response with participant count and accommodation included
    const data = plans.map(p => formatPlan(p, {
      approvedParticipants: p._count.participant,
      accommodation: accommodationMap.get(p.travel_plan_id) || null
    }));

    res.json(paginatedResponse(data, total, { page, pageSize }));
  } catch (error) {
    console.error("Error fetching ongoing plans:", error);
    return handlePrismaError(error, res, 'Fetching ongoing plans');
  }
}

