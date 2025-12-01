import { prisma, executeWithRetry, handlePrismaError } from "../../src/lib/prismaHelpers.js";
import { Request, Response } from "express";

/**
 * Get all participants for a travel plan
 */
export async function get_participants(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const participants = await executeWithRetry(() =>
      prisma.participant.findMany({
        where: { travel_plan_id: parseInt(id) },
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
        orderBy: { joined_at: 'asc' }
      })
    );

    res.json({
      message: "Success",
      data: participants
    });
  } catch (error) {
    console.error("Error fetching participants:", error);
    return handlePrismaError(error, res, 'Fetching participants');
  }
}

/**
 * Add a participant to a travel plan
 * Only counts APPROVED participants toward slot limits
 */
export async function add_participant(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { user_id, role = 'Viewer' } = req.body;
    const planId = parseInt(id);

    // Check if plan exists
    const plan = await executeWithRetry(() =>
      prisma.travelPlan.findUnique({
        where: { travel_plan_id: planId }
      })
    );

    if (!plan) {
      return res.status(404).json({ error: "Travel plan not found" });
    }

    // Get approved participant count
    const approvedCount = await executeWithRetry(() =>
      prisma.participant.count({
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
      prisma.participant.findFirst({
        where: { travel_plan_id: planId, user_id }
      })
    );

    if (existing) {
      return res.status(409).json({ error: "User is already a participant" });
    }

    // Add participant with approved status (owner/admin is adding directly)
    const participant = await executeWithRetry(() =>
      prisma.participant.create({
        data: {
          travel_plan_id: planId,
          user_id,
          role,
          status: true // Directly added = approved
        }
      })
    );

    // Fetch with user info
    const participantWithUser = await executeWithRetry(() =>
      prisma.participant.findUnique({
        where: { participant_id: participant.participant_id },
        include: {
          user: {
            select: {
              user_id: true,
              first_name: true,
              last_name: true
            }
          }
        }
      })
    );

    res.status(201).json({
      message: "Participant added successfully",
      participant: participantWithUser
    });
  } catch (error: any) {
    console.error("Error adding participant:", error);
    if (error.code === 'P2002') {
      return res.status(409).json({ error: "User is already a participant" });
    }
    return handlePrismaError(error, res, 'Adding participant');
  }
}

/**
 * Update participant role or status
 * Prevents demoting/removing the last Admin
 */
export async function update_participant(req: Request, res: Response) {
  try {
    const { id, userId } = req.params;
    const { role, status } = req.body;
    const planId = parseInt(id);
    const userIdInt = parseInt(userId);

    const participant = await executeWithRetry(() =>
      prisma.participant.findFirst({
        where: { travel_plan_id: planId, user_id: userIdInt }
      })
    );

    if (!participant) {
      return res.status(404).json({ error: "Participant not found" });
    }

    // Safeguard: prevent demoting the last Admin
    if (participant.role === 'Admin' && role && role !== 'Admin') {
      const adminCount = await executeWithRetry(() =>
        prisma.participant.count({
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
        prisma.travelPlan.findUnique({
          where: { travel_plan_id: planId }
        })
      );

      const approvedCount = await executeWithRetry(() =>
        prisma.participant.count({
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
    const updateData: Record<string, any> = {};
    if (role) updateData.role = role;
    if (status !== undefined) updateData.status = status;

    const updated = await executeWithRetry(() =>
      prisma.participant.update({
        where: { participant_id: participant.participant_id },
        data: updateData,
        include: {
          user: {
            select: {
              user_id: true,
              first_name: true,
              last_name: true
            }
          }
        }
      })
    );

    res.json({
      message: "Participant updated successfully",
      participant: updated
    });
  } catch (error) {
    console.error("Error updating participant:", error);
    return handlePrismaError(error, res, 'Updating participant');
  }
}

/**
 * Remove a participant from a travel plan
 * Prevents removing the last Admin
 */
export async function remove_participant(req: Request, res: Response) {
  try {
    const { id, userId } = req.params;
    const planId = parseInt(id);
    const userIdInt = parseInt(userId);

    const participant = await executeWithRetry(() =>
      prisma.participant.findFirst({
        where: { travel_plan_id: planId, user_id: userIdInt }
      })
    );

    if (!participant) {
      return res.status(404).json({ error: "Participant not found" });
    }

    // Prevent removing the last admin
    if (participant.role === 'Admin' && participant.status === true) {
      const adminCount = await executeWithRetry(() =>
        prisma.participant.count({
          where: { travel_plan_id: planId, role: 'Admin', status: true }
        })
      );

      if (adminCount <= 1) {
        return res.status(400).json({
          error: "Cannot remove the last admin from the plan"
        });
      }
    }

    await executeWithRetry(() =>
      prisma.participant.delete({
        where: { participant_id: participant.participant_id }
      })
    );

    res.json({
      message: "Participant removed successfully"
    });
  } catch (error) {
    console.error("Error removing participant:", error);
    return handlePrismaError(error, res, 'Removing participant');
  }
}

/**
 * Update collaborators (bulk update of participants)
 * Legacy endpoint for backward compatibility
 */
export async function collaborators_edit(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { collaborators } = req.body;
    const planId = parseInt(id);

    if (!collaborators || !Array.isArray(collaborators)) {
      return res.status(400).json({ error: "collaborators array is required" });
    }

    // Check admin count before bulk update
    const currentAdmins = await executeWithRetry(() =>
      prisma.participant.findMany({
        where: { travel_plan_id: planId, role: 'Admin', status: true }
      })
    );

    // Validate that at least one admin will remain after updates
    const adminIds = currentAdmins.map(a => a.user_id);
    const willHaveAdmin = collaborators.some((c: any) => 
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
    await prisma.$transaction(async (tx) => {
      for (const collab of collaborators) {
        const existing = await tx.participant.findFirst({
          where: { 
            travel_plan_id: planId, 
            user_id: collab.user_id 
          }
        });

        if (existing) {
          await tx.participant.update({
            where: { participant_id: existing.participant_id },
            data: {
              role: collab.role,
              status: collab.status
            }
          });
        } else {
          await tx.participant.create({
            data: {
              travel_plan_id: planId,
              user_id: collab.user_id,
              role: collab.role || 'Viewer',
              status: collab.status !== undefined ? collab.status : false
            }
          });
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
    return handlePrismaError(error, res, 'Updating collaborators');
  }
}

