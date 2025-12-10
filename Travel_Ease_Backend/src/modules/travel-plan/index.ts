/**
 * Travel Plan Module
 * 
 * Exports all travel plan-related functionality.
 * This module provides a single entry point for travel plan operations.
 */

import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';

// Controllers
export { create_plan } from './controllers/createPlan.js';
export { fetch_plans } from './controllers/fetchPlans.js';
export { ongoing_plan } from './controllers/ongoingPlans.js';
export { previous_plans } from './controllers/previousPlans.js';
export { public_plans } from './controllers/publicPlans.js';
export { all_plans, invalidateGroupedPlansCache } from './controllers/allPlans.js';
export { plans_id } from './controllers/plansId.js';
export { create_activity } from './controllers/createActivity.js';
export { fetch_activities } from './controllers/fetchActivities.js';
export { activity_edit } from './controllers/activityEdit.js';
export { toggle_activity_priority } from './controllers/toggleActivityPriority.js';
export { plan_edit } from './controllers/planEdit.js';
export { 
  quick_join, 
  request_join, 
  get_pending_requests, 
  approve_join, 
  deny_join 
} from './controllers/quickJoin.js';
export { delete_activity } from './controllers/deleteActivity.js';
export { update_activity } from './controllers/updateActivity.js';
export {
  get_user_role,
  get_participants,
  add_participant,
  update_participant,
  remove_participant,
  collaborators_edit
} from './controllers/participants.js';

// Utils
export { formatPlan, formatPlans } from './utils/formatPlan.js';
export { parsePagination, buildPlanFilters, paginatedResponse } from './utils/pagination.js';
export { 
  normalizeBudgetRange, 
  formatActivity, 
  formatActivities,
  BUDGET_RANGES,
  PRISMA_BUDGET_RANGES,
  BUDGET_RANGE_TO_PRISMA,
  BUDGET_RANGE_FROM_PRISMA
} from './utils/activityConstants.js';

// Services (from src/services)
export * from '../../services/travelPlanService.js';
export * from '../../services/activityService.js';

// Legacy endpoint - returns API info
export function travel_plan(req: Request, res: Response) {
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
export function finished_plan(req: Request, res: Response) {
  res.redirect(301, '/api/travel_plan/previous_plans?status=Completed');
}

// Legacy - redirect notice
export function specific_plans(req: Request, res: Response) {
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
export async function join_plan(req: Request, res: Response) {
  try {
    const { travel_plan_id, role = 'Viewer' } = req.body;
    const userId = req.user!.id;

    if (!travel_plan_id) {
      return res.status(400).json({ error: 'travel_plan_id is required' });
    }

    // Get plan with participant info
    const plan = await prisma.travel_plan.findUnique({
      where: { travel_plan_id: parseInt(travel_plan_id) },
      include: {
        participant: { where: { user_id: userId } },
        _count: { select: { participant: { where: { status: true } } } }
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
    if (plan.participant.length > 0) {
      const existing = plan.participant[0];
      if (existing.status) {
        return res.status(409).json({ error: 'You are already a participant' });
      }
      return res.status(409).json({ error: 'You already have a pending request' });
    }

    // Check slots (only approved count toward limit)
    if (plan.max_slots && plan._count.participant >= plan.max_slots) {
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
