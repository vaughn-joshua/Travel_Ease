import { prisma } from "../../src/lib/prisma.js";

/**
 * Get all participants for a travel plan
 */
export async function get_participants(req, res) {
  try {
    const { id } = req.params;

    const participants = await prisma.participant.findMany({
      where: {
        travel_plan_id: parseInt(id)
      },
      include: {
        user: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        }
      },
      orderBy: {
        joined_at: 'asc'
      }
    });

    res.json({
      message: "Success",
      data: participants
    });
  } catch (error) {
    console.error("Error fetching participants:", error);
    res.status(500).json({ error: error.message });
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

    // Check if plan exists and get approved participant count
    const plan = await prisma.travelPlan.findUnique({
      where: { travel_plan_id: parseInt(id) },
      include: {
        _count: { select: { participants: { where: { status: true } } } }
      }
    });

    if (!plan) {
      return res.status(404).json({ error: "Travel plan not found" });
    }

    // Check slot limits (only approved participants count)
    const approvedCount = plan._count.participants;
    if (plan.max_slots && approvedCount >= plan.max_slots) {
      return res.status(400).json({
        error: "Plan is full",
        details: `Maximum slots (${plan.max_slots}) reached`
      });
    }

    // Check if user already a participant
    const existing = await prisma.participant.findFirst({
      where: {
        travel_plan_id: parseInt(id),
        user_id: user_id
      }
    });

    if (existing) {
      return res.status(409).json({ error: "User is already a participant" });
    }

    // Add participant with approved status (owner/admin is adding directly)
    const participant = await prisma.participant.create({
      data: {
        travel_plan_id: parseInt(id),
        user_id,
        role,
        status: true // Directly added = approved
      },
      include: {
        user: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true
          }
        }
      }
    });

    res.status(201).json({
      message: "Participant added successfully",
      participant
    });
  } catch (error) {
    console.error("Error adding participant:", error);
    if (error.code === 'P2002') {
      return res.status(409).json({ error: "User is already a participant" });
    }
    res.status(500).json({ error: error.message });
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

    const participant = await prisma.participant.findFirst({
      where: {
        travel_plan_id: parseInt(id),
        user_id: parseInt(userId)
      }
    });

    if (!participant) {
      return res.status(404).json({ error: "Participant not found" });
    }

    // Safeguard: prevent demoting the last Admin
    if (participant.role === 'Admin' && role && role !== 'Admin') {
      const adminCount = await prisma.participant.count({
        where: {
          travel_plan_id: parseInt(id),
          role: 'Admin',
          status: true
        }
      });

      if (adminCount <= 1) {
        return res.status(400).json({
          error: "Cannot demote the last admin",
          details: "Promote another participant to Admin first"
        });
      }
    }

    // When approving, check slot limits
    if (status === true && participant.status === false) {
      const plan = await prisma.travelPlan.findUnique({
        where: { travel_plan_id: parseInt(id) },
        include: {
          _count: { select: { participants: { where: { status: true } } } }
        }
      });

      if (plan && plan.max_slots && plan._count.participants >= plan.max_slots) {
        return res.status(400).json({
          error: "Cannot approve - plan is full",
          details: `Maximum slots (${plan.max_slots}) reached`
        });
      }
    }

    const updated = await prisma.participant.update({
      where: {
        participant_id: participant.participant_id
      },
      data: {
        ...(role && { role }),
        ...(status !== undefined && { status })
      },
      include: {
        user: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true
          }
        }
      }
    });

    res.json({
      message: "Participant updated successfully",
      participant: updated
    });
  } catch (error) {
    console.error("Error updating participant:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Remove a participant from a travel plan
 * Prevents removing the last Admin
 */
export async function remove_participant(req, res) {
  try {
    const { id, userId } = req.params;

    const participant = await prisma.participant.findFirst({
      where: {
        travel_plan_id: parseInt(id),
        user_id: parseInt(userId)
      }
    });

    if (!participant) {
      return res.status(404).json({ error: "Participant not found" });
    }

    // Prevent removing the last admin
    if (participant.role === 'Admin' && participant.status === true) {
      const adminCount = await prisma.participant.count({
        where: {
          travel_plan_id: parseInt(id),
          role: 'Admin',
          status: true
        }
      });

      if (adminCount <= 1) {
        return res.status(400).json({
          error: "Cannot remove the last admin from the plan"
        });
      }
    }

    await prisma.participant.delete({
      where: {
        participant_id: participant.participant_id
      }
    });

    res.json({
      message: "Participant removed successfully"
    });
  } catch (error) {
    console.error("Error removing participant:", error);
    res.status(500).json({ error: error.message });
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

    if (!collaborators || !Array.isArray(collaborators)) {
      return res.status(400).json({ error: "collaborators array is required" });
    }

    // Check admin count before bulk update
    const currentAdmins = await prisma.participant.findMany({
      where: {
        travel_plan_id: parseInt(id),
        role: 'Admin',
        status: true
      }
    });

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
    const result = await prisma.$transaction(
      collaborators.map(collab =>
        prisma.participant.upsert({
          where: {
            participant_id: collab.participant_id || 0
          },
          create: {
            travel_plan_id: parseInt(id),
            user_id: collab.user_id,
            role: collab.role || 'Viewer',
            status: collab.status !== undefined ? collab.status : false
          },
          update: {
            role: collab.role,
            status: collab.status
          }
        })
      )
    );

    res.json({
      message: "Collaborators updated successfully",
      count: result.length
    });
  } catch (error) {
    console.error("Error updating collaborators:", error);
    res.status(500).json({ error: error.message });
  }
}
