import { prisma, executeWithRetry, handlePrismaError } from "../../src/lib/prismaHelpers.js";
import { parsePagination, buildPlanFilters, paginatedResponse } from "../util/pagination.js";
import { formatPlan } from "../util/formatPlan.js";

/**
 * Fetch upcoming plans for the authenticated user:
 * - Draft plans (being prepared)
 * - Active plans with future start_date (scheduled but not yet started)
 */
export async function fetch_plans(req, res) {
  try {
    const userId = req.user.id;
    const { page, pageSize, skip, take } = parsePagination(req.query);
    const filters = buildPlanFilters(req.query);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get plan IDs where user is a participant
    const participantPlanIds = await executeWithRetry(() =>
      prisma.participant.findMany({
        where: { user_id: userId, status: true },
        select: { travel_plan_id: true }
      })
    );
    const planIds = participantPlanIds.map(p => p.travel_plan_id).filter(Boolean);

    // Build where clause
    const where = {
      AND: [
        // Status filter: Draft OR (Active with future start_date)
        {
          OR: [
            { status: 'Draft' },
            { 
              status: 'Active', 
              start_date: { gt: today } 
            }
          ]
        },
        // User access filter: owner or participant
        {
          OR: [
            { user_id: userId },
            ...(planIds.length > 0 ? [{ travel_plan_id: { in: planIds } }] : [])
          ]
        },
        // Additional filters from query params
        ...Object.keys(filters).length > 0 ? [filters] : []
      ]
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
            visibility: true
          },
          orderBy: [{ start_date: { sort: 'asc', nulls: 'last' } }],
          skip,
          take
        }),
        prisma.travelPlan.count({ where })
      ])
    );

    // Get participant counts for each plan
    const planIdList = plans.map(p => p.travel_plan_id);
    const participantCounts = planIdList.length > 0 
      ? await executeWithRetry(() =>
          prisma.participant.groupBy({
            by: ['travel_plan_id'],
            where: { 
              travel_plan_id: { in: planIdList },
              status: true 
            },
            _count: { participant_id: true }
          })
        )
      : [];

    // Create a map for quick lookup
    const countMap = {};
    participantCounts.forEach(c => {
      countMap[c.travel_plan_id] = c._count.participant_id;
    });

    // Add participant count to each plan with normalized DTO
    const data = plans.map(p => formatPlan(p, {
      approvedParticipants: countMap[p.travel_plan_id] || 0
    }));

    res.json(paginatedResponse(data, total, { page, pageSize }));
  } catch (error) {
    console.error("Error fetching plans:", error);
    return handlePrismaError(error, res, 'Fetching plans');
  }
}
