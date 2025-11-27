import { prisma } from "../../src/lib/prisma.js";
import { parsePagination, buildPlanFilters, paginatedResponse } from "../util/pagination.js";

/**
 * Fetch previous (Completed or Cancelled) plans for the authenticated user
 * Supports pagination and filtering via query params:
 * - status: 'Completed' | 'Cancelled' (defaults to both)
 */
export async function previous_plans(req, res) {
  try {
    const userId = req.user.id;
    const { page, pageSize, skip } = parsePagination(req.query);
    const filters = buildPlanFilters(req.query);

    // Allow filtering by specific status (Completed or Cancelled)
    const statusFilter = req.query.status;
    const validStatuses = ['Completed', 'Cancelled'];
    const statuses = statusFilter && validStatuses.includes(statusFilter)
      ? [statusFilter]
      : validStatuses;

    // User must be owner or participant
    const where = {
      status: { in: statuses },
      ...filters,
      OR: [
        { user_id: userId },
        { participants: { some: { user_id: userId } } }
      ]
    };

    // Merge search OR with user access OR using AND
    if (filters.OR) {
      where.AND = [
        { OR: filters.OR },
        { OR: where.OR }
      ];
      delete where.OR;
      delete filters.OR;
    }

    const [plans, total] = await Promise.all([
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
          _count: { select: { participants: true } }
        },
        orderBy: { end_date: 'desc' },
        skip,
        take: pageSize
      }),
      prisma.travelPlan.count({ where })
    ]);

    const data = plans.map(p => ({
      ...p,
      participantCount: p._count.participants,
      _count: undefined
    }));

    res.json(paginatedResponse(data, total, { page, pageSize }));
  } catch (error) {
    console.error("Error fetching previous plans:", error);
    res.status(500).json({ error: error.message });
  }
}
