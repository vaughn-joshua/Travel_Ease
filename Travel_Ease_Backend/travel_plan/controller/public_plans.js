import { Op, fn, col } from "sequelize";
import { TravelPlan, Participant, User } from "../../src/models/index.js";
import { executeWithRetry } from "../../src/lib/sequelize.js";
import { parsePagination, buildPlanFilters, paginatedResponse } from "../util/pagination.js";
import { handleSequelizeError } from "../../src/lib/queryHelpers.js";
import { formatPlan } from "../util/formatPlan.js";

/**
 * Fetch public plans (visibility=true, not expired)
 * Read-only listing; joining requires auth
 * Supports pagination and filtering
 */
export async function public_plans(req, res) {
  try {
    const { page, pageSize, limit, offset } = parsePagination(req.query);
    const filters = buildPlanFilters(req.query);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where = {
      visibility: true,
      status: { [Op.in]: ['Draft', 'Active'] }, // Only show joinable plans
      // Not expired: visibility_end_date is null or in the future
      [Op.or]: [
        { visibility_end_date: null },
        { visibility_end_date: { [Op.gte]: today } }
      ],
      ...filters
    };

    const [plans, total] = await executeWithRetry(() =>
      Promise.all([
        TravelPlan.findAll({
          where,
          attributes: [
            'travel_plan_id',
            'name',
            'start_date',
            'end_date',
            'description',
            'location',
            'max_slots',
            'visibility_timestamp',
            'status'
          ],
          include: [{
            model: User,
            as: 'user',
            attributes: ['user_id', 'first_name', 'last_name']
          }],
          order: [['visibility_timestamp', 'DESC NULLS LAST']],
          limit,
          offset
        }),
        TravelPlan.count({ where })
      ])
    );

    // Get participant counts for each plan
    const planIdList = plans.map(p => p.travel_plan_id);
    const participantCounts = planIdList.length > 0 
      ? await executeWithRetry(() =>
          Participant.findAll({
            where: { 
              travel_plan_id: { [Op.in]: planIdList },
              status: true 
            },
            attributes: [
              'travel_plan_id',
              [fn('COUNT', col('participant_id')), 'count']
            ],
            group: ['travel_plan_id'],
            raw: true
          })
        )
      : [];

    const countMap = {};
    participantCounts.forEach(c => {
      countMap[c.travel_plan_id] = parseInt(c.count);
    });

    // Add slot availability info with normalized DTO
    const data = plans.map(p => {
      const approvedCount = countMap[p.travel_plan_id] || 0;
      const planData = p.toJSON ? p.toJSON() : p;
      return formatPlan(p, {
        approvedParticipants: approvedCount,
        slotsAvailable: planData.max_slots ? planData.max_slots - approvedCount : null
      });
    });

    res.json(paginatedResponse(data, total, { page, pageSize }));
  } catch (error) {
    console.error("Error fetching public plans:", error);
    return handleSequelizeError(error, res, 'Fetching public plans');
  }
}
