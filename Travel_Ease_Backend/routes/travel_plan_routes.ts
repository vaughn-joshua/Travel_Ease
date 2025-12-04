/*
apis

get upcoming plans
get finished plans
get specific travel  plan

post travel plan (create plan)

put plan (edit travel plan)
put plan activity (edit activity) NOT SURE SA SEQUENCE, how will the sequence be kept
put plan participants (edit collaborators)

get public travel plans (for joiners)
get plans (for quick join)

put join plan (for anyone na magjjoin)*/

import { Router } from 'express';
import { authenticateToken } from '../src/middleware/auth.js';
import { requirePlanOwnership, requireActivityAccess } from '../src/middleware/ownership.js';
import {
  validate,
  createPlanSchema,
  editPlanSchema,
  createActivitySchema,
  editActivitySchema,
  addParticipantSchema,
  updateParticipantSchema,
  joinPlanSchema
} from '../src/schemas/validation.js';
import {
  activity_edit,
  collaborators_edit,
  create_plan,
  finished_plan,
  join_plan,
  plan_edit,
  plans_id,
  public_plans,
  specific_plans,
  fetch_plans,
  ongoing_plan,
  previous_plans,
  create_activity,
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
} from '../travel_plan/index.js';

const router = Router();

// Public routes (no auth required)
router.get('/public_plans', public_plans);
router.post('/quick_join', quick_join); // Search is public, joining requires auth

// Quick join queue routes (auth required)
router.post('/request_join', authenticateToken, request_join);
router.put('/:id/approve/:participantId', authenticateToken, requirePlanOwnership, approve_join);
router.delete('/:id/deny/:participantId', authenticateToken, requirePlanOwnership, deny_join);

// Protected routes (authentication required)
router.get('/ongoing_plan', authenticateToken, ongoing_plan);
router.get('/plans', authenticateToken, fetch_plans);
router.get('/previous_plans', authenticateToken, previous_plans);
router.get('/plans/:id', authenticateToken, plans_id);
router.get('/activities/:id', authenticateToken, fetch_activities);

// Create routes (auth + validation)
router.post('/create_plan', authenticateToken, validate(createPlanSchema), create_plan);
router.post('/create_activity', authenticateToken, validate(createActivitySchema), create_activity);

router.get('/:id/pending_requests', authenticateToken, requirePlanOwnership, get_pending_requests);

// Edit routes (auth + ownership + validation)
router.put('/edit_plan/:id', authenticateToken, requirePlanOwnership, validate(editPlanSchema), plan_edit);
router.put('/activity_edit/:id', authenticateToken, requireActivityAccess, validate(editActivitySchema), activity_edit);
router.put('/collaborators_edit/:id', authenticateToken, requirePlanOwnership, collaborators_edit);
router.put('/update_activity/:id', authenticateToken, requirePlanOwnership, update_activity);

// Join/participant routes
router.put('/join_plan', authenticateToken, validate(joinPlanSchema), join_plan);

// Delete routes (auth + ownership)
router.delete('/delete_activity/:id', authenticateToken, requireActivityAccess, delete_activity);

// Participant management routes
router.get('/:id/participants', authenticateToken, get_participants);
router.post('/:id/participants', authenticateToken, requirePlanOwnership, validate(addParticipantSchema), add_participant);
router.put('/:id/participants/:userId', authenticateToken, requirePlanOwnership, validate(updateParticipantSchema), update_participant);
router.delete('/:id/participants/:userId', authenticateToken, requirePlanOwnership, remove_participant);

// Legacy/specific routes
router.get('/specific_plans', specific_plans); //is this redudant?

export default router;

