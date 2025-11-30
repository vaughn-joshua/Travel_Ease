import { Op, fn, col } from "sequelize";
import { TravelPlan, Participant, User } from "../../src/models/index.js";
import { executeWithRetry } from "../../src/lib/sequelize.js";
import { handleSequelizeError } from "../../src/lib/queryHelpers.js";

/**
 * Search for matching public plans (no auth required)
 */
export async function quick_join(req, res) {
  try {
    const { start_date, end_date, location } = req.body;

    if (!start_date || !end_date || !location) {
      return res.status(400).json({
        error: "Missing required fields",
        details: "start_date, end_date, and location are required"
      });
    }

    // Find visible plans with overlapping dates and matching location
    const plans = await executeWithRetry(() =>
      TravelPlan.findAll({
        where: {
          [Op.and]: [
            { start_date: { [Op.lte]: new Date(end_date) } },
            { end_date: { [Op.gte]: new Date(start_date) } },
            { location: { [Op.iLike]: `%${location}%` } },
            { visibility: true },
            { status: { [Op.in]: ['Draft', 'Active'] } }
          ]
        },
        attributes: [
          'travel_plan_id',
          'name',
          'start_date',
          'end_date',
          'description',
          'location',
          'max_slots'
        ],
        include: [{
          model: User,
          as: 'user',
          attributes: ['user_id', 'first_name', 'last_name']
        }]
      })
    );

    // Get participant counts for each plan
    const planIds = plans.map(p => p.travel_plan_id);
    const participantCounts = planIds.length > 0 
      ? await executeWithRetry(() =>
          Participant.findAll({
            where: { 
              travel_plan_id: { [Op.in]: planIds },
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

    // Add slot availability
    const data = plans.map(p => {
      const planData = p.toJSON();
      const approvedCount = countMap[p.travel_plan_id] || 0;
      return {
        ...planData,
        approvedParticipants: approvedCount,
        slotsAvailable: planData.max_slots ? planData.max_slots - approvedCount : null,
        isFull: planData.max_slots ? approvedCount >= planData.max_slots : false
      };
    });

    res.json(data);
  } catch (error) {
    console.error("Error in quick join search:", error);
    return handleSequelizeError(error, res, 'Quick join search');
  }
}

/**
 * Request to join a plan (requires auth)
 * Creates a pending participant entry in the queue
 */
export async function request_join(req, res) {
  try {
    const { travel_plan_id } = req.body;
    const userId = req.user.id;

    if (!travel_plan_id) {
      return res.status(400).json({ error: "travel_plan_id is required" });
    }

    const planId = parseInt(travel_plan_id);

    // Get plan
    const plan = await executeWithRetry(() =>
      TravelPlan.findByPk(planId)
    );

    if (!plan) {
      return res.status(404).json({ error: "Travel plan not found" });
    }

    // Check if plan is visible and joinable
    if (!plan.visibility) {
      return res.status(400).json({ error: "This plan is not open for joining" });
    }

    if (plan.status !== 'Draft' && plan.status !== 'Active') {
      return res.status(400).json({ error: "This plan is not accepting new participants" });
    }

    // Check for duplicate (pending or approved)
    const existing = await executeWithRetry(() =>
      Participant.findOne({
        where: { travel_plan_id: planId, user_id: userId }
      })
    );

    if (existing) {
      if (existing.status) {
        return res.status(409).json({ error: "You are already a participant in this plan" });
      } else {
        return res.status(409).json({ error: "You already have a pending join request for this plan" });
      }
    }

    // Check slot availability (only count approved participants)
    const approvedCount = await executeWithRetry(() =>
      Participant.count({
        where: { travel_plan_id: planId, status: true }
      })
    );

    if (plan.max_slots && approvedCount >= plan.max_slots) {
      return res.status(400).json({
        error: "Plan is full",
        details: `Maximum slots (${plan.max_slots}) reached`
      });
    }

    // Create pending participant (join request)
    const participant = await executeWithRetry(() =>
      Participant.create({
        travel_plan_id: planId,
        user_id: userId,
        role: 'Viewer',
        status: false // Pending approval
      })
    );

    // Fetch with user info
    const participantWithUser = await executeWithRetry(() =>
      Participant.findByPk(participant.participant_id, {
        include: [{
          model: User,
          as: 'user',
          attributes: ['user_id', 'first_name', 'last_name', 'email']
        }]
      })
    );

    res.status(201).json({
      message: "Join request submitted. Waiting for approval.",
      participant: participantWithUser
    });
  } catch (error) {
    console.error("Error requesting to join:", error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: "You already have a pending request for this plan" });
    }
    return handleSequelizeError(error, res, 'Requesting to join');
  }
}

/**
 * Get pending join requests for a plan (Admin/Owner only)
 */
export async function get_pending_requests(req, res) {
  try {
    const { id } = req.params;

    const pending = await executeWithRetry(() =>
      Participant.findAll({
        where: {
          travel_plan_id: parseInt(id),
          status: false // Pending
        },
        include: [{
          model: User,
          as: 'user',
          attributes: ['user_id', 'first_name', 'last_name', 'email']
        }],
        order: [['joined_at', 'ASC']]
      })
    );

    res.json({
      message: "Success",
      data: pending,
      count: pending.length
    });
  } catch (error) {
    console.error("Error fetching pending requests:", error);
    return handleSequelizeError(error, res, 'Fetching pending requests');
  }
}

/**
 * Approve a join request (Admin/Owner only)
 */
export async function approve_join(req, res) {
  try {
    const { id, participantId } = req.params;
    const planId = parseInt(id);
    const participantIdInt = parseInt(participantId);

    // Get plan
    const plan = await executeWithRetry(() =>
      TravelPlan.findByPk(planId)
    );

    if (!plan) {
      return res.status(404).json({ error: "Travel plan not found" });
    }

    // Find the pending participant
    const participant = await executeWithRetry(() =>
      Participant.findByPk(participantIdInt)
    );

    if (!participant) {
      return res.status(404).json({ error: "Join request not found" });
    }

    if (participant.travel_plan_id !== planId) {
      return res.status(400).json({ error: "Participant does not belong to this plan" });
    }

    if (participant.status === true) {
      return res.status(400).json({ error: "This participant is already approved" });
    }

    // Check slot availability before approving
    const approvedCount = await executeWithRetry(() =>
      Participant.count({
        where: { travel_plan_id: planId, status: true }
      })
    );

    if (plan.max_slots && approvedCount >= plan.max_slots) {
      return res.status(400).json({
        error: "Cannot approve - plan is full",
        details: `Maximum slots (${plan.max_slots}) reached`
      });
    }

    // Approve the participant
    await participant.update({ status: true });

    // Fetch updated with user info
    const updated = await executeWithRetry(() =>
      Participant.findByPk(participantIdInt, {
        include: [{
          model: User,
          as: 'user',
          attributes: ['user_id', 'first_name', 'last_name', 'email']
        }]
      })
    );

    res.json({
      message: "Join request approved",
      participant: updated
    });
  } catch (error) {
    console.error("Error approving join request:", error);
    return handleSequelizeError(error, res, 'Approving join request');
  }
}

/**
 * Deny (remove) a join request (Admin/Owner only)
 */
export async function deny_join(req, res) {
  try {
    const { id, participantId } = req.params;
    const planId = parseInt(id);
    const participantIdInt = parseInt(participantId);

    const participant = await executeWithRetry(() =>
      Participant.findByPk(participantIdInt)
    );

    if (!participant) {
      return res.status(404).json({ error: "Join request not found" });
    }

    if (participant.travel_plan_id !== planId) {
      return res.status(400).json({ error: "Participant does not belong to this plan" });
    }

    // Only allow denying pending requests
    if (participant.status === true) {
      return res.status(400).json({
        error: "Cannot deny an approved participant. Use remove instead."
      });
    }

    await participant.destroy();

    res.json({ message: "Join request denied" });
  } catch (error) {
    console.error("Error denying join request:", error);
    return handleSequelizeError(error, res, 'Denying join request');
  }
}
