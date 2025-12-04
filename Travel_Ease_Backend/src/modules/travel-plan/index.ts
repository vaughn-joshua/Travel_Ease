import { Request, Response } from 'express';
import { create_plan } from './controllers/createPlan.js';
import { fetch_plans } from './controllers/fetchPlans.js';
import { ongoing_plan } from './controllers/ongoingPlans.js';
import { previous_plans } from './controllers/previousPlans.js';
import { public_plans } from './controllers/publicPlans.js';
import { plans_id } from './controllers/plansId.js';
import { create_activity } from './controllers/createActivity.js';
import { fetch_activities } from './controllers/fetchActivities.js';
import { activity_edit } from './controllers/activityEdit.js';
import { plan_edit } from './controllers/planEdit.js';
import { 
  quick_join, 
  request_join, 
  get_pending_requests, 
  approve_join, 
  deny_join 
} from './controllers/quickJoin.js';
import { delete_activity } from './controllers/deleteActivity.js';
import { update_activity } from './controllers/updateActivity.js';
import {
  get_participants,
  add_participant,
  update_participant,
  remove_participant,
  collaborators_edit
} from './controllers/participants.js';
import { prisma } from '../../lib/prisma.js';

// Legacy endpoint - returns API info
function travel_plan(req: Request, res: Response) {
  res.json({
    message: 'Travel Plan API',
    version: '1.0',
    endpoints: {
      plans: '/api/travel_plan/plans',
      ongoing: '/api/travel_plan/ongoing_plan',
      previous: '/api/travel_plan/previous_plans',
      public: '/api/travel_plan/public_plans'
    }
  });
}

// Legacy - redirect to previous_plans
function finished_plan(req: Request, res: Response) {
  res.redirect(301, '/api/travel_plan/previous_plans?status=Completed');
}

// Legacy - redirect notice
function specific_plans(req: Request, res: Response) {
  res.status(410).json({
    error: 'Deprecated endpoint',
    message: 'Use GET /api/travel_plan/plans/:id instead'
  });
}

interface PrismaError extends Error {
  code?: string;
}

/**
 * Join plan - creates a pending join request (requires approval)
 * Uses the queue system: status=false until approved
 */
async function join_plan(req: Request, res: Response) {
  try {
    const { travel_plan_id, role = 'Viewer' } = req.body;
    const userId = req.user!.id;

    if (!travel_plan_id) {
      return res.status(400).json({ error: 'travel_plan_id is required' });
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
      return res.status(404).json({ error: 'Travel plan not found' });
    }

    // Check if plan is visible and joinable
    if (!plan.visibility) {
      return res.status(400).json({ error: 'This plan is not open for joining' });
    }
    if (plan.status !== 'Draft' && plan.status !== 'Active') {
      return res.status(400).json({ error: 'This plan is not accepting new participants' });
    }

    // Check for duplicate
    if (plan.participants.length > 0) {
      const existing = plan.participants[0];
      if (existing.status) {
        return res.status(409).json({ error: 'You are already a participant' });
      }
      return res.status(409).json({ error: 'You already have a pending request' });
    }

    // Check slots (only approved count toward limit)
    if (plan.max_slots && plan._count.participants >= plan.max_slots) {
      return res.status(400).json({
        error: 'Plan is full',
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
      message: 'Join request submitted. Waiting for approval.',
      participant
    });
  } catch (error) {
    console.error('Error in join_plan:', error);
    const prismaError = error as PrismaError;
    if (prismaError.code === 'P2002') {
      return res.status(409).json({ error: 'Already a participant' });
    }
    res.status(500).json({ error: (error as Error).message });
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

