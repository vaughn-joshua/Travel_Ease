import { prisma, executeWithRetry, handlePrismaError } from "../../../lib/prismaHelpers.js";
import { parsePagination, buildPlanFilters, paginatedResponse } from "../utils/pagination.js";
import { formatPlan } from "../utils/formatPlan.js";
import { getAccommodationForPlans } from "../utils/getAccommodation.js";
import { Request, Response } from "express";

/**
 * Fetch UPCOMING plans for the authenticated user:
 * - Only Draft plans (being prepared)
 * 
 * Active plans belong in ongoing_plans
 */
export async function fetch_plans(req: Request, res: Response) {
  try {
    console.log('[fetchPlans] Request received - req.user:', req.user);
    if (!req.user) {
      console.error('[fetchPlans] ERROR: req.user is undefined!');
      return res.status(401).json({ error: 'Authentication required' });
    }
    const userId = req.user.id;
    console.log('[fetchPlans] Starting - userId:', userId);
    const { page, pageSize, skip, take } = parsePagination(req.query as Record<string, string>);
    const filters = buildPlanFilters(req.query as Record<string, string>);
    console.log('[fetchPlans] Pagination:', { page, pageSize, skip, take });
    console.log('[fetchPlans] Filters:', filters);

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
    console.log('[fetchPlans] Raw SQL query result:', userPlanAccess);
    const accessiblePlanIds = userPlanAccess.map(p => p.travel_plan_id);
    console.log('[fetchPlans] Accessible plan IDs:', accessiblePlanIds);

    if (accessiblePlanIds.length === 0) {
      console.log('[fetchPlans] No accessible plans found for user, returning empty');
      return res.json(paginatedResponse([], 0, { page, pageSize }));
    }

    // Build where clause for UPCOMING plans
    // Only Draft plans - Active plans are in ongoing
    const where: any = {
      travel_plan_id: { in: accessiblePlanIds },
      status: 'Draft',
      // Apply any additional filters
      ...filters
    };
    console.log('[fetchPlans] Where clause:', JSON.stringify(where, null, 2));

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
    console.log('[fetchPlans] Plans found:', plans.length, 'Total:', total);
    console.log('[fetchPlans] Plans data:', plans.map(p => ({ id: p.travel_plan_id, name: p.name, status: p.status })));

    // Fetch accommodation for all plans
    const planIds = plans.map(p => p.travel_plan_id);
    const accommodationMap = await getAccommodationForPlans(planIds);
    console.log('[fetchPlans] Accommodation map:', Array.from(accommodationMap.entries()));

    // Format response with participant count and accommodation included
    const data = plans.map(p => formatPlan(p, {
      approvedParticipants: p._count.participant,
      accommodation: accommodationMap.get(p.travel_plan_id) || null
    }));
    console.log('[fetchPlans] Formatted data count:', data.length);
    console.log('[fetchPlans] Final response data:', data);

    res.json(paginatedResponse(data, total, { page, pageSize }));
  } catch (error) {
    console.error("Error fetching upcoming plans:", error);
    return handlePrismaError(error, res, 'Fetching upcoming plans');
  }
}

