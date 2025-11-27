import { prisma } from "../../src/lib/prisma.js";
import { parsePagination, buildPlanFilters, paginatedResponse } from "../util/pagination.js";

/**
 * Fetch upcoming (Draft status) plans for the authenticated user
 * Supports pagination and filtering via query params:
 * - page, pageSize: pagination
 * - search: search in name/description
 * - location: filter by location
 * - startDateFrom, startDateTo: filter by start_date range
 */
export async function fetch_plans(req, res) {
  try {
    const userId = req.user.id;
    const { page, pageSize, skip } = parsePagination(req.query);
    const filters = buildPlanFilters(req.query);

    // User must be owner or participant
    const where = {
      status: 'Draft',
      ...filters,
      OR: [
        { user_id: userId },
        { participants: { some: { user_id: userId, status: true } } }
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
          max_slots: true,
          visibility: true,
          _count: { select: { participants: { where: { status: true } } } }
        },
        orderBy: { start_date: 'asc' },
        skip,
        take: pageSize
      }),
      prisma.travelPlan.count({ where })
    ]);

    // Flatten _count to approvedParticipants
    const data = plans.map(p => ({
      ...p,
      approvedParticipants: p._count.participants,
      _count: undefined
    }));

    res.json(paginatedResponse(data, total, { page, pageSize }));
  } catch (error) {
    console.error("Error fetching plans:", error);
    res.status(500).json({ error: error.message });
  }
}
