import { Op, fn, col } from "sequelize";
import { TravelPlan, Participant, User } from "../../src/models/index.js";
import { sequelize, executeWithRetry } from "../../src/lib/sequelize.js";
import { handleSequelizeError } from "../../src/lib/queryHelpers.js";

/**
 * Get all participants for a travel plan
 */
export async function get_participants(req, res) {
  try {
    const { id } = req.params;

    const participants = await executeWithRetry(() =>
      Participant.findAll({
        where: { travel_plan_id: parseInt(id) },
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
      data: participants
    });
  } catch (error) {
    console.error("Error fetching participants:", error);
    return handleSequelizeError(error, res, 'Fetching participants');
  }
}

/**
 * Add a participant to a travel plan
 * Only counts APPROVED participants toward slot limits
 */
export async function add_participant(req, res) {
  try {
    const { id } = req.params;
    const { user_id, role = 'Viewer' } = req.body;
    const planId = parseInt(id);

    // Check if plan exists
    const plan = await executeWithRetry(() =>
      TravelPlan.findByPk(planId)
    );

    if (!plan) {
      return res.status(404).json({ error: "Travel plan not found" });
    }

    // Get approved participant count
    const approvedCount = await executeWithRetry(() =>
      Participant.count({
        where: { travel_plan_id: planId, status: true }
      })
    );

    // Check slot limits (only approved participants count)
    if (plan.max_slots && approvedCount >= plan.max_slots) {
      return res.status(400).json({
        error: "Plan is full",
        details: `Maximum slots (${plan.max_slots}) reached`
      });
    }

    // Check if user already a participant
    const existing = await executeWithRetry(() =>
      Participant.findOne({
        where: { travel_plan_id: planId, user_id }
      })
    );

    if (existing) {
      return res.status(409).json({ error: "User is already a participant" });
    }

    // Add participant with approved status (owner/admin is adding directly)
    const participant = await executeWithRetry(() =>
      Participant.create({
        travel_plan_id: planId,
        user_id,
        role,
        status: true // Directly added = approved
      })
    );

    // Fetch with user info
    const participantWithUser = await executeWithRetry(() =>
      Participant.findByPk(participant.participant_id, {
        include: [{
          model: User,
          as: 'user',
          attributes: ['user_id', 'first_name', 'last_name']
        }]
      })
    );

    res.status(201).json({
      message: "Participant added successfully",
      participant: participantWithUser
    });
  } catch (error) {
    console.error("Error adding participant:", error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: "User is already a participant" });
    }
    return handleSequelizeError(error, res, 'Adding participant');
  }
}

/**
 * Update participant role or status
 * Prevents demoting/removing the last Admin
 */
export async function update_participant(req, res) {
  try {
    const { id, userId } = req.params;
    const { role, status } = req.body;
    const planId = parseInt(id);
    const userIdInt = parseInt(userId);

    const participant = await executeWithRetry(() =>
      Participant.findOne({
        where: { travel_plan_id: planId, user_id: userIdInt }
      })
    );

    if (!participant) {
      return res.status(404).json({ error: "Participant not found" });
    }

    // Safeguard: prevent demoting the last Admin
    if (participant.role === 'Admin' && role && role !== 'Admin') {
      const adminCount = await executeWithRetry(() =>
        Participant.count({
          where: { travel_plan_id: planId, role: 'Admin', status: true }
        })
      );

      if (adminCount <= 1) {
        return res.status(400).json({
          error: "Cannot demote the last admin",
          details: "Promote another participant to Admin first"
        });
      }
    }

    // When approving, check slot limits
    if (status === true && participant.status === false) {
      const plan = await executeWithRetry(() =>
        TravelPlan.findByPk(planId)
      );

      const approvedCount = await executeWithRetry(() =>
        Participant.count({
          where: { travel_plan_id: planId, status: true }
        })
      );

      if (plan && plan.max_slots && approvedCount >= plan.max_slots) {
        return res.status(400).json({
          error: "Cannot approve - plan is full",
          details: `Maximum slots (${plan.max_slots}) reached`
        });
      }
    }

    // Update participant
    const updateData = {};
    if (role) updateData.role = role;
    if (status !== undefined) updateData.status = status;

    await participant.update(updateData);

    // Fetch updated with user info
    const updated = await executeWithRetry(() =>
      Participant.findByPk(participant.participant_id, {
        include: [{
          model: User,
          as: 'user',
          attributes: ['user_id', 'first_name', 'last_name']
        }]
      })
    );

    res.json({
      message: "Participant updated successfully",
      participant: updated
    });
  } catch (error) {
    console.error("Error updating participant:", error);
    return handleSequelizeError(error, res, 'Updating participant');
  }
}

/**
 * Remove a participant from a travel plan
 * Prevents removing the last Admin
 */
export async function remove_participant(req, res) {
  try {
    const { id, userId } = req.params;
    const planId = parseInt(id);
    const userIdInt = parseInt(userId);

    const participant = await executeWithRetry(() =>
      Participant.findOne({
        where: { travel_plan_id: planId, user_id: userIdInt }
      })
    );

    if (!participant) {
      return res.status(404).json({ error: "Participant not found" });
    }

    // Prevent removing the last admin
    if (participant.role === 'Admin' && participant.status === true) {
      const adminCount = await executeWithRetry(() =>
        Participant.count({
          where: { travel_plan_id: planId, role: 'Admin', status: true }
        })
      );

      if (adminCount <= 1) {
        return res.status(400).json({
          error: "Cannot remove the last admin from the plan"
        });
      }
    }

    await participant.destroy();

    res.json({
      message: "Participant removed successfully"
    });
  } catch (error) {
    console.error("Error removing participant:", error);
    return handleSequelizeError(error, res, 'Removing participant');
  }
}

/**
 * Update collaborators (bulk update of participants)
 * Legacy endpoint for backward compatibility
 */
export async function collaborators_edit(req, res) {
  try {
    const { id } = req.params;
    const { collaborators } = req.body;
    const planId = parseInt(id);

    if (!collaborators || !Array.isArray(collaborators)) {
      return res.status(400).json({ error: "collaborators array is required" });
    }

    // Check admin count before bulk update
    const currentAdmins = await executeWithRetry(() =>
      Participant.findAll({
        where: { travel_plan_id: planId, role: 'Admin', status: true }
      })
    );

    // Validate that at least one admin will remain after updates
    const adminIds = currentAdmins.map(a => a.user_id);
    const willHaveAdmin = collaborators.some(c => 
      (c.role === 'Admin' && c.status !== false) || 
      (adminIds.includes(c.user_id) && c.role !== 'Editor' && c.role !== 'Viewer')
    );

    if (currentAdmins.length > 0 && !willHaveAdmin) {
      return res.status(400).json({
        error: "Cannot remove all admins",
        details: "At least one admin must remain on the plan"
      });
    }

    // Use transaction for bulk updates
    let count = 0;
    await sequelize.transaction(async (t) => {
      for (const collab of collaborators) {
        const [participant, created] = await Participant.findOrCreate({
          where: { 
            travel_plan_id: planId, 
            user_id: collab.user_id 
          },
          defaults: {
            travel_plan_id: planId,
            user_id: collab.user_id,
            role: collab.role || 'Viewer',
            status: collab.status !== undefined ? collab.status : false
          },
          transaction: t
        });

        if (!created) {
          await participant.update({
            role: collab.role,
            status: collab.status
          }, { transaction: t });
        }
        count++;
      }
    });

    res.json({
      message: "Collaborators updated successfully",
      count
    });
  } catch (error) {
    console.error("Error updating collaborators:", error);
    return handleSequelizeError(error, res, 'Updating collaborators');
  }
}
