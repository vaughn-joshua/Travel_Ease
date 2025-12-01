import { prisma, executeWithRetry, handlePrismaError } from "../../src/lib/prismaHelpers.js";
import { parsePagination, buildPlanFilters, paginatedResponse } from "../util/pagination.js";
import { formatPlan } from "../util/formatPlan.js";

/**
 * Fetch previous (Completed or Cancelled) plans for the authenticated user
 * Supports pagination and filtering via query params:
 * - status: 'Completed' | 'Cancelled' (defaults to both)
 */
export async function previous_plans(req, res) {
  try {
    const userId = req.user.id;
    const { page, pageSize, skip, take } = parsePagination(req.query);
    const filters = buildPlanFilters(req.query);

    // Allow filtering by specific status (Completed or Cancelled)
    const statusFilter = req.query.status;
    const validStatuses = ['Completed', 'Cancelled'];
    const statuses = statusFilter && validStatuses.includes(statusFilter)
      ? [statusFilter]
      : validStatuses;

    // Get plan IDs where user is a participant
    const participantPlanIds = await executeWithRetry(() =>
      prisma.participant.findMany({
        where: { user_id: userId },
        select: { travel_plan_id: true }
      })
    );
    const planIds = participantPlanIds.map(p => p.travel_plan_id).filter(Boolean);

    // Build where clause: user is owner or participant
    const where = {
      status: { in: statuses },
      OR: [
        { user_id: userId },
        ...(planIds.length > 0 ? [{ travel_plan_id: { in: planIds } }] : [])
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
            status: true
          },
          orderBy: [{ end_date: { sort: 'desc', nulls: 'last' } }],
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
            where: { travel_plan_id: { in: planIdList } },
            _count: { participant_id: true }
          })
        )
      : [];

    const countMap = {};
    participantCounts.forEach(c => {
      countMap[c.travel_plan_id] = c._count.participant_id;
    });

    const data = plans.map(p => formatPlan(p, {
      participantCount: countMap[p.travel_plan_id] || 0,
      approvedParticipants: countMap[p.travel_plan_id] || 0
    }));

    res.json(paginatedResponse(data, total, { page, pageSize }));
  } catch (error) {
    console.error("Error fetching previous plans:", error);
    return handlePrismaError(error, res, 'Fetching previous plans');
  }
}
