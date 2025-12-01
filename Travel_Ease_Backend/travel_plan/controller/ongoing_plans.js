import { Op, fn, col } from "sequelize";
import { TravelPlan, Participant } from "../../src/models/index.js";
import { executeWithRetry } from "../../src/lib/sequelize.js";
import { parsePagination, buildPlanFilters, paginatedResponse } from "../util/pagination.js";
import { handleSequelizeError } from "../../src/lib/queryHelpers.js";
import { formatPlan } from "../util/formatPlan.js";

/**
 * Fetch ongoing (Active status) plans for the authenticated user
 * Supports pagination and filtering via query params
 */
export async function ongoing_plan(req, res) {
  try {
    const userId = req.user.id;
    const { page, pageSize, limit, offset } = parsePagination(req.query);
    const filters = buildPlanFilters(req.query);

    // Get plan IDs where user is a participant
    const participantPlanIds = await executeWithRetry(() =>
      Participant.findAll({
        where: { user_id: userId, status: true },
        attributes: ['travel_plan_id'],
        raw: true
      })
    );
    const planIds = participantPlanIds.map(p => p.travel_plan_id);

    // Build where clause: Active plans where user is owner or participant
    const where = {
      status: 'Active',
      [Op.or]: [
        { user_id: userId },
        ...(planIds.length > 0 ? [{ travel_plan_id: { [Op.in]: planIds } }] : [])
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
            'status',
            'max_slots'
          ],
          order: [['start_date', 'ASC NULLS LAST']],
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

    // Create a map for quick lookup
    const countMap = {};
    participantCounts.forEach(c => {
      countMap[c.travel_plan_id] = parseInt(c.count);
    });

    const data = plans.map(p => formatPlan(p, {
      approvedParticipants: countMap[p.travel_plan_id] || 0
    }));

    res.json(paginatedResponse(data, total, { page, pageSize }));
  } catch (error) {
    console.error("Error fetching ongoing plans:", error);
    return handleSequelizeError(error, res, 'Fetching ongoing plans');
  }
}
