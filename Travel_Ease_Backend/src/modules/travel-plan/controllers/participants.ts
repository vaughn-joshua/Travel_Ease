import { prisma, executeWithRetry, handlePrismaError } from "../../../lib/prismaHelpers.js";
import { invalidateCachePattern } from "../../../lib/cache.js";
import { Request, Response } from "express";
import { createNotification } from "../../notification/index.js";

/**
 * Helper to invalidate plan-related caches
 */
async function invalidatePlanCaches(planId: number, userId?: number): Promise<void> {
  const invalidations = [
    invalidateCachePattern('travel_plans:public:'),
  ];
  
  if (userId) {
    invalidations.push(
      invalidateCachePattern(`travel_plans:upcoming:${userId}`),
      invalidateCachePattern(`travel_plans:ongoing:${userId}`)
    );
  }
  
  await Promise.all(invalidations);
}

/**
 * Get the current user's role for a specific plan
 * Returns: { isOwner, role, isParticipant }
 */
export async function get_user_role(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const planId = parseInt(id);

    // Get the plan to check ownership
    const plan = await executeWithRetry(() =>
      prisma.travel_plan.findUnique({
        where: { travel_plan_id: planId },
        select: { user_id: true }
      })
    );

    if (!plan) {
      return res.status(404).json({ error: "Travel plan not found" });
    }

    const isOwner = plan.user_id === userId;

    // Check if user is a participant
    const participant = await executeWithRetry(() =>
      prisma.participant.findFirst({
        where: { 
          travel_plan_id: planId, 
          user_id: userId,
          status: true // Only approved participants
        },
        select: { role: true }
      })
    );

    res.json({
      isOwner,
      role: participant?.role || null,
      isParticipant: !!participant
    });
  } catch (error) {
    return handlePrismaError(error, res, 'Getting user role');
  }
}

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
      prisma.travel_plan.findUnique({
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
      return res.status(409).json({ error: "User is already a participant or has pending invitation" });
    }

    // Get inviter info
    const inviterId = req.user!.id;
    const inviter = await executeWithRetry(() =>
      prisma.user.findUnique({
        where: { user_id: inviterId },
        select: { first_name: true, last_name: true }
      })
    );
    const inviterName = inviter ? `${inviter.first_name} ${inviter.last_name}` : "Someone";

    // Add participant with PENDING status (invitation flow)
    const participant = await executeWithRetry(() =>
      prisma.participant.create({
        data: {
          travel_plan_id: planId,
          user_id,
          role,
          status: false // Pending until user accepts invitation
        }
      })
    );

    // Create notification for the invited user
    await createNotification(
      user_id,
      "plan_invitation",
      "You've been invited to a travel plan!",
      `${inviterName} invited you to join "${plan.name}"`,
      {
        travel_plan_id: planId,
        inviter_id: inviterId,
        inviter_name: inviterName,
        plan_name: plan.name
      }
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

    // Invalidate caches for both users
    await invalidatePlanCaches(planId, user_id);

    res.status(201).json({
      message: "Invitation sent successfully",
      participant: participantWithUser
    });
  } catch (error: any) {
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
        prisma.travel_plan.findUnique({
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

    // Invalidate caches
    await invalidatePlanCaches(planId, userIdInt);

    res.json({
      message: "Participant updated successfully",
      participant: updated
    });
  } catch (error) {
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

    // Invalidate caches
    await invalidatePlanCaches(planId, userIdInt);

    res.json({
      message: "Participant removed successfully"
    });
  } catch (error) {
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

    // Get plan with max_slots and current approved count
    const [plan, currentApprovedCount, currentAdmins] = await executeWithRetry(() =>
      Promise.all([
        prisma.travel_plan.findUnique({
          where: { travel_plan_id: planId }
        }),
        prisma.participant.count({
          where: { travel_plan_id: planId, status: true }
        }),
        prisma.participant.findMany({
          where: { travel_plan_id: planId, role: 'Admin', status: true }
        })
      ])
    );

    if (!plan) {
      return res.status(404).json({ error: "Travel plan not found" });
    }

    // Calculate how many new approvals are being requested
    const existingParticipants = await executeWithRetry(() =>
      prisma.participant.findMany({
        where: { travel_plan_id: planId }
      })
    );

    const existingMap = new Map(existingParticipants.map(p => [p.user_id, p]));
    let newApprovals = 0;

    for (const collab of collaborators) {
      const existing = existingMap.get(collab.user_id);
      const willBeApproved = collab.status === true;
      const wasApproved = existing?.status === true;
      
      if (willBeApproved && !wasApproved) {
        newApprovals++;
      }
    }

    // Check slot limits
    if (plan.max_slots && (currentApprovedCount + newApprovals) > plan.max_slots) {
      return res.status(400).json({
        error: "Cannot approve - would exceed max slots",
        details: `Current: ${currentApprovedCount}, New approvals: ${newApprovals}, Max: ${plan.max_slots}`
      });
    }

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
        const existing = existingMap.get(collab.user_id);

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

    // Invalidate caches for all affected users
    const allUserIds = collaborators.map((c: any) => c.user_id);
    await Promise.all([
      invalidateCachePattern('travel_plans:public:'),
      ...allUserIds.map((uid: number) => invalidateCachePattern(`travel_plans:upcoming:${uid}`)),
      ...allUserIds.map((uid: number) => invalidateCachePattern(`travel_plans:ongoing:${uid}`)),
    ]);

    res.json({
      message: "Collaborators updated successfully",
      count
    });
  } catch (error) {
    return handlePrismaError(error, res, 'Updating collaborators');
  }
}

