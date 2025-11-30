import { Op, fn, col, literal } from "sequelize";
import { TravelPlan, Participant } from "../../src/models/index.js";
import { sequelize, executeWithRetry } from "../../src/lib/sequelize.js";
import { parsePagination, buildPlanFilters, paginatedResponse } from "../util/pagination.js";
import { handleSequelizeError } from "../../src/lib/queryHelpers.js";

/**
 * Fetch upcoming plans for the authenticated user:
 * - Draft plans (being prepared)
 * - Active plans with future start_date (scheduled but not yet started)
 */
export async function fetch_plans(req, res) {
  try {
    const userId = req.user.id;
    const { page, pageSize, limit, offset } = parsePagination(req.query);
    const filters = buildPlanFilters(req.query);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get plan IDs where user is a participant
    const participantPlanIds = await executeWithRetry(() =>
      Participant.findAll({
        where: { user_id: userId, status: true },
        attributes: ['travel_plan_id'],
        raw: true
      })
    );
    const planIds = participantPlanIds.map(p => p.travel_plan_id);

    // Build where clause
    const where = {
      [Op.and]: [
        // Status filter: Draft OR (Active with future start_date)
        {
          [Op.or]: [
            { status: 'Draft' },
            { 
              status: 'Active', 
              start_date: { [Op.gt]: today } 
            }
          ]
        },
        // User access filter: owner or participant
        {
          [Op.or]: [
            { user_id: userId },
            ...(planIds.length > 0 ? [{ travel_plan_id: { [Op.in]: planIds } }] : [])
          ]
        },
        // Additional filters from query params
        ...Object.keys(filters).length > 0 ? [filters] : []
      ]
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
            'max_slots',
            'visibility'
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

    // Add participant count to each plan
    const data = plans.map(p => ({
      ...p.toJSON(),
      approvedParticipants: countMap[p.travel_plan_id] || 0
    }));

    res.json(paginatedResponse(data, total, { page, pageSize }));
  } catch (error) {
    console.error("Error fetching plans:", error);
    return handleSequelizeError(error, res, 'Fetching plans');
  }
}
