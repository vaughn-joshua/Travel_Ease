import {
  prisma,
  executeWithRetry,
  handlePrismaError,
} from "../../../lib/prismaHelpers.js";
import { formatPlan } from "../utils/formatPlan.js";
import { getAccommodationForPlans } from "../utils/getAccommodation.js";
import { Request, Response } from "express";

/**
 * Search for matching public plans (no auth required)
 */
export async function quick_join(req: Request, res: Response) {
  try {
    const { start_date, end_date, location } = req.body;

    if (!start_date || !end_date || !location) {
      return res.status(400).json({
        error: "Missing required fields",
        details: "start_date, end_date, and location are required",
      });
    }

    // Find visible plans with overlapping dates and matching location
    const plans = await executeWithRetry(() =>
      prisma.travelPlan.findMany({
        where: {
          AND: [
            { start_date: { lte: new Date(end_date) } },
            { end_date: { gte: new Date(start_date) } },
            { location: { contains: location, mode: "insensitive" } },
            { visibility: true },
            { status: { in: ["Draft", "Active"] } },
          ],
        },
        select: {
          travel_plan_id: true,
          name: true,
          start_date: true,
          end_date: true,
          description: true,
          location: true,
          max_slots: true,
          user: {
            select: {
              user_id: true,
              first_name: true,
              last_name: true,
            },
          },
        },
      })
    );

    // Get participant counts for each plan
    const planIds = plans.map((p) => p.travel_plan_id);
    const participantCounts =
      planIds.length > 0
        ? await executeWithRetry(() =>
            prisma.participant.groupBy({
              by: ["travel_plan_id"],
              where: {
                travel_plan_id: { in: planIds },
                status: true,
              },
              _count: { participant_id: true },
            })
          )
        : [];

    const countMap: Record<number, number> = {};
    participantCounts.forEach((c) => {
      if (c.travel_plan_id !== null) {
        countMap[c.travel_plan_id] = c._count.participant_id;
      }
    });

    // Fetch accommodation for all plans
    const accommodationMap = await getAccommodationForPlans(planIds);

    // Add slot availability with normalized DTO
    const data = plans.map((p) => {
      const approvedCount = countMap[p.travel_plan_id] || 0;
      return formatPlan(p, {
        approvedParticipants: approvedCount,
        slotsAvailable: p.max_slots ? p.max_slots - approvedCount : null,
        isFull: p.max_slots ? approvedCount >= p.max_slots : false,
        accommodation: accommodationMap.get(p.travel_plan_id) || null,
      });
    });

    res.json(data);
  } catch (error) {
    console.error("Error in quick join search:", error);
    return handlePrismaError(error, res, "Quick join search");
  }
}

/**
 * Request to join a plan (requires auth)
 * Creates a pending participant entry in the queue
 */
export async function request_join(req: Request, res: Response) {
  try {
    const { travel_plan_id } = req.body;
    const userId = req.user!.id;

    if (!travel_plan_id) {
      return res.status(400).json({ error: "travel_plan_id is required" });
    }

    const planId = parseInt(travel_plan_id);

    // Get plan
    const plan = await executeWithRetry(() =>
      prisma.travelPlan.findUnique({
        where: { travel_plan_id: planId },
      })
    );

    if (!plan) {
      return res.status(404).json({ error: "Travel plan not found" });
    }

    // Check if plan is visible and joinable
    if (!plan.visibility) {
      return res
        .status(400)
        .json({ error: "This plan is not open for joining" });
    }

    if (plan.status !== "Draft" && plan.status !== "Active") {
      return res
        .status(400)
        .json({ error: "This plan is not accepting new participants" });
    }

    // Check for duplicate (pending or approved)
    const existing = await executeWithRetry(() =>
      prisma.participant.findFirst({
        where: { travel_plan_id: planId, user_id: userId },
      })
    );

    if (existing) {
      if (existing.status) {
        return res
          .status(409)
          .json({ error: "You are already a participant in this plan" });
      } else {
        return res
          .status(409)
          .json({
            error: "You already have a pending join request for this plan",
          });
      }
    }

    // Check slot availability (only count approved participants)
    const approvedCount = await executeWithRetry(() =>
      prisma.participant.count({
        where: { travel_plan_id: planId, status: true },
      })
    );

    if (plan.max_slots && approvedCount >= plan.max_slots) {
      return res.status(400).json({
        error: "Plan is full",
        details: `Maximum slots (${plan.max_slots}) reached`,
      });
    }

    // Create pending participant (join request)
    const participant = await executeWithRetry(() =>
      prisma.participant.create({
        data: {
          travel_plan_id: planId,
          user_id: userId,
          role: "Viewer",
          status: false, // Pending approval
        },
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
              last_name: true,
              email: true,
            },
          },
        },
      })
    );

    res.status(201).json({
      message: "Join request submitted. Waiting for approval.",
      participant: participantWithUser,
    });
  } catch (error: any) {
    console.error("Error requesting to join:", error);
    if (error.code === "P2002") {
      return res
        .status(409)
        .json({ error: "You already have a pending request for this plan" });
    }
    return handlePrismaError(error, res, "Requesting to join");
  }
}

/**
 * Get pending join requests for a plan (Admin/Owner only)
 */
export async function get_pending_requests(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const pending = await executeWithRetry(() =>
      prisma.participant.findMany({
        where: {
          travel_plan_id: parseInt(id),
          status: false, // Pending
        },
        include: {
          user: {
            select: {
              user_id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
        },
        orderBy: { joined_at: "asc" },
      })
    );

    res.json({
      message: "Success",
      data: pending,
      count: pending.length,
    });
  } catch (error) {
    console.error("Error fetching pending requests:", error);
    return handlePrismaError(error, res, "Fetching pending requests");
  }
}

/**
 * Approve a join request (Admin/Owner only)
 */
export async function approve_join(req: Request, res: Response) {
  try {
    const { id, participantId } = req.params;
    const planId = parseInt(id);
    const participantIdInt = parseInt(participantId);

    // Get plan
    const plan = await executeWithRetry(() =>
      prisma.travelPlan.findUnique({
        where: { travel_plan_id: planId },
      })
    );

    if (!plan) {
      return res.status(404).json({ error: "Travel plan not found" });
    }

    // Find the pending participant
    const participant = await executeWithRetry(() =>
      prisma.participant.findUnique({
        where: { participant_id: participantIdInt },
      })
    );

    if (!participant) {
      return res.status(404).json({ error: "Join request not found" });
    }

    if (participant.travel_plan_id !== planId) {
      return res
        .status(400)
        .json({ error: "Participant does not belong to this plan" });
    }

    if (participant.status === true) {
      return res
        .status(400)
        .json({ error: "This participant is already approved" });
    }

    // Check slot availability before approving
    const approvedCount = await executeWithRetry(() =>
      prisma.participant.count({
        where: { travel_plan_id: planId, status: true },
      })
    );

    if (plan.max_slots && approvedCount >= plan.max_slots) {
      return res.status(400).json({
        error: "Cannot approve - plan is full",
        details: `Maximum slots (${plan.max_slots}) reached`,
      });
    }

    // Approve the participant
    const updated = await executeWithRetry(() =>
      prisma.participant.update({
        where: { participant_id: participantIdInt },
        data: { status: true },
        include: {
          user: {
            select: {
              user_id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
        },
      })
    );

    res.json({
      message: "Join request approved",
      participant: updated,
    });
  } catch (error) {
    console.error("Error approving join request:", error);
    return handlePrismaError(error, res, "Approving join request");
  }
}

/**
 * Deny (remove) a join request (Admin/Owner only)
 */
export async function deny_join(req: Request, res: Response) {
  try {
    const { id, participantId } = req.params;
    const planId = parseInt(id);
    const participantIdInt = parseInt(participantId);

    const participant = await executeWithRetry(() =>
      prisma.participant.findUnique({
        where: { participant_id: participantIdInt },
      })
    );

    if (!participant) {
      return res.status(404).json({ error: "Join request not found" });
    }

    if (participant.travel_plan_id !== planId) {
      return res
        .status(400)
        .json({ error: "Participant does not belong to this plan" });
    }

    // Only allow denying pending requests
    if (participant.status === true) {
      return res.status(400).json({
        error: "Cannot deny an approved participant. Use remove instead.",
      });
    }

    await executeWithRetry(() =>
      prisma.participant.delete({
        where: { participant_id: participantIdInt },
      })
    );

    res.json({ message: "Join request denied" });
  } catch (error) {
    console.error("Error denying join request:", error);
    return handlePrismaError(error, res, "Denying join request");
  }
}

