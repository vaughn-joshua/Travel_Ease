import { create_plan } from "./controller/create_plan.js";
import { fetch_plans } from "./controller/fetch_plans.js";
import { ongoing_plan } from "./controller/ongoing_plans.js";
import { previous_plans } from "./controller/previous_plans.js";
import { public_plans } from "./controller/public_plans.js";
import { plans_id } from "./controller/plans_id.js";
import { create_activity } from "./controller/create_activity.js";
import { fetch_activities } from "./controller/fetch_activities.js";
import { activity_edit } from "./controller/activity_edit.js";
import { plan_edit } from "./controller/plan_edit.js";
import { 
  quick_join, 
  request_join, 
  get_pending_requests, 
  approve_join, 
  deny_join 
} from "./controller/quick_join.js";
import { delete_activity } from "./controller/delete_activty.js";
import { update_activity } from "./controller/update_activity.js";
import {
  get_participants,
  add_participant,
  update_participant,
  remove_participant,
  collaborators_edit
} from "./controller/participants.js";
import { prisma } from "../src/lib/prisma.js";

// Legacy endpoint - returns API info
function travel_plan(req, res) {
  res.json({
    message: "Travel Plan API",
    version: "1.0",
    endpoints: {
      plans: "/api/travel_plan/plans",
      ongoing: "/api/travel_plan/ongoing_plan",
      previous: "/api/travel_plan/previous_plans",
      public: "/api/travel_plan/public_plans"
    }
  });
}

// Legacy - redirect to previous_plans
function finished_plan(req, res) {
  res.redirect(301, "/api/travel_plan/previous_plans?status=Completed");
}

// Legacy - redirect notice
function specific_plans(req, res) {
  res.status(410).json({
    error: "Deprecated endpoint",
    message: "Use GET /api/travel_plan/plans/:id instead"
  });
}

/**
 * Join plan - creates a pending join request (requires approval)
 * Uses the queue system: status=false until approved
 */
async function join_plan(req, res) {
  try {
    const { travel_plan_id, role = 'Viewer' } = req.body;
    const userId = req.user.id;

    if (!travel_plan_id) {
      return res.status(400).json({ error: "travel_plan_id is required" });
    }

    // Get plan with participant info
    const plan = await prisma.travelPlan.findUnique({
      where: { travel_plan_id: parseInt(travel_plan_id) },
      include: {
        participants: { where: { user_id: userId } },
        _count: { select: { participants: { where: { status: true } } } }
      }
    });

    if (!plan) {
      return res.status(404).json({ error: "Travel plan not found" });
    }

    // Check for duplicate
    if (plan.participants.length > 0) {
      const existing = plan.participants[0];
      if (existing.status) {
        return res.status(409).json({ error: "You are already a participant" });
      }
      return res.status(409).json({ error: "You already have a pending request" });
    }

    // Check slots (only approved count toward limit)
    if (plan.max_slots && plan._count.participants >= plan.max_slots) {
      return res.status(400).json({
        error: "Plan is full",
        details: `Maximum slots (${plan.max_slots}) reached`
      });
    }

    // Create pending participant
    const participant = await prisma.participant.create({
      data: {
        travel_plan_id: parseInt(travel_plan_id),
        user_id: userId,
        role: role,
        status: false // Pending approval
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
      message: "Join request submitted. Waiting for approval.",
      participant
    });
  } catch (error) {
    console.error("Error in join_plan:", error);
    if (error.code === 'P2002') {
      return res.status(409).json({ error: "Already a participant" });
    }
    res.status(500).json({ error: error.message });
  }
}

export {
  travel_plan,
  finished_plan,
  plans_id,
  create_plan,
  plan_edit,
  create_activity,
  activity_edit,
  collaborators_edit,
  specific_plans,
  join_plan,
  fetch_plans,
  ongoing_plan,
  previous_plans,
  public_plans,
  fetch_activities,
  quick_join,
  request_join,
  get_pending_requests,
  approve_join,
  deny_join,
  delete_activity,
  update_activity,
  get_participants,
  add_participant,
  update_participant,
  remove_participant,
};
