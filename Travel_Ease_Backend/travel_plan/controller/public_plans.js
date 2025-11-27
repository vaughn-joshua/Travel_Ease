import { prisma } from "../../src/lib/prisma.js";
import { parsePagination, buildPlanFilters, paginatedResponse } from "../util/pagination.js";

/**
 * Fetch public plans (visibility=true, not expired)
 * Read-only listing; joining requires auth
 * Supports pagination and filtering
 */
export async function public_plans(req, res) {
  try {
    const { page, pageSize, skip } = parsePagination(req.query);
    const filters = buildPlanFilters(req.query);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where = {
      visibility: true,
      status: { in: ['Draft', 'Active'] }, // Only show joinable plans
      ...filters,
      // Not expired: visibility_end_date is null or in the future
      OR: [
        { visibility_end_date: null },
        { visibility_end_date: { gte: today } }
      ]
    };

    // If search filter has its own OR, merge with AND
    if (filters.OR) {
      where.AND = [{ OR: filters.OR }];
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
          max_slots: true,
          visibility_timestamp: true,
          status: true,
          user: {
            select: {
              user_id: true,
              first_name: true,
              last_name: true
            }
          },
          _count: { select: { participants: { where: { status: true } } } }
        },
        orderBy: { visibility_timestamp: 'desc' },
        skip,
        take: pageSize
      }),
      prisma.travelPlan.count({ where })
    ]);

    // Add slot availability info
    const data = plans.map(p => ({
      ...p,
      approvedParticipants: p._count.participants,
      slotsAvailable: p.max_slots ? p.max_slots - p._count.participants : null,
      _count: undefined
    }));

    res.json(paginatedResponse(data, total, { page, pageSize }));
  } catch (error) {
    console.error("Error fetching public plans:", error);
    res.status(500).json({ error: error.message });
  }
}
