import { prisma } from "../../src/lib/prisma.js";
import { parsePagination, buildPlanFilters, paginatedResponse } from "../util/pagination.js";

/**
 * Fetch upcoming plans for the authenticated user:
 * - Draft plans (being prepared)
 * - Active plans with future start_date (scheduled but not yet started)
 */
export async function fetch_plans(req, res) {
  try {
    const userId = req.user.id;
    const { page, pageSize, skip } = parsePagination(req.query);
    const filters = buildPlanFilters(req.query);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // User access filter
    const userAccessFilter = [
      { user_id: userId },
      { participants: { some: { user_id: userId, status: true } } }
    ];

    // Status filter: Draft OR (Active with future start_date)
    const statusFilter = [
      { status: 'Draft' },
      { status: 'Active', start_date: { gt: today } }
    ];

    // Build where clause with AND to combine all conditions
    const conditions = [
      { OR: statusFilter },
      { OR: userAccessFilter }
    ];

    // Add search filter if present
    if (filters.OR) {
      conditions.push({ OR: filters.OR });
      delete filters.OR;
    }

    const where = {
      AND: conditions,
      ...filters
    };

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
