import { prisma, executeWithRetry, handlePrismaError } from "../../src/lib/prismaHelpers.js";
import { parsePagination, buildPlanFilters, paginatedResponse } from "../util/pagination.js";
import { formatPlan } from "../util/formatPlan.js";

/**
 * Fetch public plans (visibility=true, not expired)
 * Read-only listing; joining requires auth
 * Supports pagination and filtering
 */
export async function public_plans(req, res) {
  try {
    const { page, pageSize, skip, take } = parsePagination(req.query);
    const filters = buildPlanFilters(req.query);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where = {
      visibility: true,
      status: { in: ['Draft', 'Active'] }, // Only show joinable plans
      // Not expired: visibility_end_date is null or in the future
      OR: [
        { visibility_end_date: null },
        { visibility_end_date: { gte: today } }
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
            max_slots: true,
            visibility: true,
            visibility_timestamp: true,
            status: true,
            user: {
              select: {
                user_id: true,
                first_name: true,
                last_name: true
              }
            }
          },
          orderBy: [{ visibility_timestamp: { sort: 'desc', nulls: 'last' } }],
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

    const countMap = {};
    participantCounts.forEach(c => {
      countMap[c.travel_plan_id] = c._count.participant_id;
    });

    // Add slot availability info with normalized DTO
    const data = plans.map(p => {
      const approvedCount = countMap[p.travel_plan_id] || 0;
      return formatPlan(p, {
        approvedParticipants: approvedCount,
        slotsAvailable: p.max_slots ? p.max_slots - approvedCount : null
      });
    });

    res.json(paginatedResponse(data, total, { page, pageSize }));
  } catch (error) {
    console.error("Error fetching public plans:", error);
    return handlePrismaError(error, res, 'Fetching public plans');
  }
}
