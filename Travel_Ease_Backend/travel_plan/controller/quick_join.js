import { prisma } from "../../src/lib/prisma.js";

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
    const plans = await prisma.travelPlan.findMany({
      where: {
        AND: [
          { start_date: { lte: new Date(end_date) } },
          { end_date: { gte: new Date(start_date) } },
          { location: { contains: location, mode: 'insensitive' } },
          { visibility: true },
          { status: { in: ['Draft', 'Active'] } }
        ]
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
            last_name: true
          }
        },
        _count: { select: { participants: { where: { status: true } } } }
      }
    });

    // Add slot availability
    const data = plans.map(p => ({
      ...p,
      approvedParticipants: p._count.participants,
      slotsAvailable: p.max_slots ? p.max_slots - p._count.participants : null,
      isFull: p.max_slots ? p._count.participants >= p.max_slots : false,
      _count: undefined
    }));

    res.json(data);
  } catch (error) {
    console.error("Error in quick join search:", error);
    res.status(500).json({ error: error.message });
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

    // Get plan with participant counts
    const plan = await prisma.travelPlan.findUnique({
      where: { travel_plan_id: parseInt(travel_plan_id) },
      include: {
        participants: true,
        _count: { select: { participants: { where: { status: true } } } }
      }
    });

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
    const existing = plan.participants.find(p => p.user_id === userId);
    if (existing) {
      if (existing.status) {
        return res.status(409).json({ error: "You are already a participant in this plan" });
      } else {
        return res.status(409).json({ error: "You already have a pending join request for this plan" });
      }
    }

    // Check slot availability (only count approved participants)
    const approvedCount = plan._count.participants;
    if (plan.max_slots && approvedCount >= plan.max_slots) {
      return res.status(400).json({
        error: "Plan is full",
        details: `Maximum slots (${plan.max_slots}) reached`
      });
    }

    // Create pending participant (join request)
    const participant = await prisma.participant.create({
      data: {
        travel_plan_id: parseInt(travel_plan_id),
        user_id: userId,
        role: 'Viewer',
        status: false // Pending approval
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
      }
    });

    res.status(201).json({
      message: "Join request submitted. Waiting for approval.",
      participant
    });
  } catch (error) {
    console.error("Error requesting to join:", error);
    if (error.code === 'P2002') {
      return res.status(409).json({ error: "You already have a pending request for this plan" });
    }
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get pending join requests for a plan (Admin/Owner only)
 */
export async function get_pending_requests(req, res) {
  try {
    const { id } = req.params;

    const pending = await prisma.participant.findMany({
      where: {
        travel_plan_id: parseInt(id),
        status: false // Pending
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
      orderBy: { joined_at: 'asc' }
    });

    res.json({
      message: "Success",
      data: pending,
      count: pending.length
    });
  } catch (error) {
    console.error("Error fetching pending requests:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Approve a join request (Admin/Owner only)
 */
export async function approve_join(req, res) {
  try {
    const { id, participantId } = req.params;

    // Get plan and check slots
    const plan = await prisma.travelPlan.findUnique({
      where: { travel_plan_id: parseInt(id) },
      include: {
        _count: { select: { participants: { where: { status: true } } } }
      }
    });

    if (!plan) {
      return res.status(404).json({ error: "Travel plan not found" });
    }

    // Find the pending participant
    const participant = await prisma.participant.findUnique({
      where: { participant_id: parseInt(participantId) }
    });

    if (!participant) {
      return res.status(404).json({ error: "Join request not found" });
    }

    if (participant.travel_plan_id !== parseInt(id)) {
      return res.status(400).json({ error: "Participant does not belong to this plan" });
    }

    if (participant.status === true) {
      return res.status(400).json({ error: "This participant is already approved" });
    }

    // Check slot availability before approving
    const approvedCount = plan._count.participants;
    if (plan.max_slots && approvedCount >= plan.max_slots) {
      return res.status(400).json({
        error: "Cannot approve - plan is full",
        details: `Maximum slots (${plan.max_slots}) reached`
      });
    }

    // Approve the participant
    const updated = await prisma.participant.update({
      where: { participant_id: parseInt(participantId) },
      data: { status: true },
      include: {
        user: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        }
      }
    });

    res.json({
      message: "Join request approved",
      participant: updated
    });
  } catch (error) {
    console.error("Error approving join request:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Deny (remove) a join request (Admin/Owner only)
 */
export async function deny_join(req, res) {
  try {
    const { id, participantId } = req.params;

    const participant = await prisma.participant.findUnique({
      where: { participant_id: parseInt(participantId) }
    });

    if (!participant) {
      return res.status(404).json({ error: "Join request not found" });
    }

    if (participant.travel_plan_id !== parseInt(id)) {
      return res.status(400).json({ error: "Participant does not belong to this plan" });
    }

    // Only allow denying pending requests
    if (participant.status === true) {
      return res.status(400).json({
        error: "Cannot deny an approved participant. Use remove instead."
      });
    }

    await prisma.participant.delete({
      where: { participant_id: parseInt(participantId) }
    });

    res.json({ message: "Join request denied" });
  } catch (error) {
    console.error("Error denying join request:", error);
    res.status(500).json({ error: error.message });
  }
}
