/**
 * Phase 3 - Travel Plan Domain Tests
 * Covers: pagination, status transitions, quick join queue, collaborator safeguards, activity updates
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express, { type Express } from 'express';
import { prisma } from '../src/lib/prisma.js';
import travel_plan_routes from '../routes/travel_plan_routes.js';
import { createTestUser, cleanupTestData } from './setup.js';
import type { User } from '@prisma/client';

const app: Express = express();
app.use(express.json());
app.use('/api/travel_plan', travel_plan_routes);

describe('Phase 3 - Travel Plan Domain', () => {
  let user1: User, token1: string;
  let user2: User, token2: string;
  let user3: User, token3: string;

  beforeEach(async () => {
    await cleanupTestData();
    
    const result1 = await createTestUser({ email: `p3_user1_${Date.now()}@example.com` });
    user1 = result1.user;
    token1 = result1.token;

    const result2 = await createTestUser({ email: `p3_user2_${Date.now()}@example.com` });
    user2 = result2.user;
    token2 = result2.token;

    const result3 = await createTestUser({ email: `p3_user3_${Date.now()}@example.com` });
    user3 = result3.user;
    token3 = result3.token;
  });

  describe('Pagination & Filtering', () => {
    let planId1: number, planId2: number;

    beforeEach(async () => {
      // Create two plans with different properties
      const res1 = await request(app)
        .post('/api/travel_plan/create_plan')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'Beach Trip Manila',
          location: 'Manila',
          start_date: '2025-08-01',
          end_date: '2025-08-07'
        });
      planId1 = res1.body.travel_plan_id;

      const res2 = await request(app)
        .post('/api/travel_plan/create_plan')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'Mountain Hike Cebu',
          location: 'Cebu',
          start_date: '2025-09-01',
          end_date: '2025-09-05'
        });
      planId2 = res2.body.travel_plan_id;
    });

    it('should return paginated plans with normalized DTO', async () => {
      const response = await request(app)
        .get('/api/travel_plan/plans?page=1&pageSize=10')
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('page', 1);
      expect(response.body.pagination).toHaveProperty('pageSize', 10);
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('totalPages');
      
      // Verify normalized DTO fields
      const plan = response.body.data[0];
      expect(plan).toHaveProperty('id');
      expect(plan).toHaveProperty('travel_plan_id');
      expect(plan.id).toBe(plan.travel_plan_id);
      expect(plan).toHaveProperty('title');
      expect(plan).toHaveProperty('name');
      expect(plan.title).toBe(plan.name);
      expect(plan).toHaveProperty('is_public');
      expect(plan).toHaveProperty('visibility');
    });

    it('should filter plans by location', async () => {
      const response = await request(app)
        .get('/api/travel_plan/plans?location=Manila')
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      expect(response.body.data.every((p: { location: string }) => p.location.includes('Manila'))).toBe(true);
    });

    it('should filter plans by search term', async () => {
      const response = await request(app)
        .get('/api/travel_plan/plans?search=Beach')
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      // Can search by either name or title (both are present in normalized DTO)
      expect(response.body.data.some((p: { title: string; name: string }) => p.title.includes('Beach') || p.name.includes('Beach'))).toBe(true);
    });
  });

  describe('Status Transitions', () => {
    let planId: number;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/travel_plan/create_plan')
        .set('Authorization', `Bearer ${token1}`)
        .send({ title: 'Status Test Plan' });
      planId = res.body.travel_plan_id;
    });

    it('should allow Draft -> Active transition', async () => {
      const response = await request(app)
        .put(`/api/travel_plan/edit_plan/${planId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ status: 'Active' });

      expect(response.status).toBe(200);
      expect(response.body.plan.status).toBe('Active');
    });

    it('should allow Active -> Completed transition', async () => {
      // First activate
      await request(app)
        .put(`/api/travel_plan/edit_plan/${planId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ status: 'Active' });

      // Then complete
      const response = await request(app)
        .put(`/api/travel_plan/edit_plan/${planId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ status: 'Completed' });

      expect(response.status).toBe(200);
      expect(response.body.plan.status).toBe('Completed');
    });

    it('should reject invalid transition Draft -> Completed', async () => {
      const response = await request(app)
        .put(`/api/travel_plan/edit_plan/${planId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ status: 'Completed' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid status transition');
    });

    it('should reject transition from Completed', async () => {
      // Activate then complete
      await request(app)
        .put(`/api/travel_plan/edit_plan/${planId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ status: 'Active' });
      
      await request(app)
        .put(`/api/travel_plan/edit_plan/${planId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ status: 'Completed' });

      // Try to reactivate
      const response = await request(app)
        .put(`/api/travel_plan/edit_plan/${planId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ status: 'Active' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid status transition');
    });

    it('should set visibility_timestamp when making visible', async () => {
      const response = await request(app)
        .put(`/api/travel_plan/edit_plan/${planId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ visibility: true });

      expect(response.status).toBe(200);
      expect(response.body.plan.visibility).toBe(true);
      expect(response.body.plan.visibility_timestamp).not.toBeNull();
    });
  });

  describe('Quick Join Queue', () => {
    let planId: number;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/travel_plan/create_plan')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'Join Test Plan',
          location: 'Tagaytay',
          max_slots: 3
        });
      planId = res.body.travel_plan_id;

      // Make plan visible
      await request(app)
        .put(`/api/travel_plan/edit_plan/${planId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ visibility: true });
    });

    it('should create pending join request', async () => {
      const response = await request(app)
        .post('/api/travel_plan/request_join')
        .set('Authorization', `Bearer ${token2}`)
        .send({ travel_plan_id: planId });

      expect(response.status).toBe(201);
      expect(response.body.message).toContain('Waiting for approval');
      expect(response.body.participant.status).toBe(false);
    });

    it('should list pending requests for owner', async () => {
      // Create a join request
      await request(app)
        .post('/api/travel_plan/request_join')
        .set('Authorization', `Bearer ${token2}`)
        .send({ travel_plan_id: planId });

      // List pending
      const response = await request(app)
        .get(`/api/travel_plan/${planId}/pending_requests`)
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].user.user_id).toBe(user2.user_id);
    });

    it('should approve join request', async () => {
      // Create request
      const joinRes = await request(app)
        .post('/api/travel_plan/request_join')
        .set('Authorization', `Bearer ${token2}`)
        .send({ travel_plan_id: planId });

      const participantId = joinRes.body.participant.participant_id;

      // Approve
      const response = await request(app)
        .put(`/api/travel_plan/${planId}/approve/${participantId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      expect(response.body.participant.status).toBe(true);
    });

    it('should deny join request', async () => {
      // Create request
      const joinRes = await request(app)
        .post('/api/travel_plan/request_join')
        .set('Authorization', `Bearer ${token2}`)
        .send({ travel_plan_id: planId });

      const participantId = joinRes.body.participant.participant_id;

      // Deny
      const response = await request(app)
        .delete(`/api/travel_plan/${planId}/deny/${participantId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('denied');
    });

    it('should reject duplicate join request', async () => {
      // First request
      await request(app)
        .post('/api/travel_plan/request_join')
        .set('Authorization', `Bearer ${token2}`)
        .send({ travel_plan_id: planId });

      // Duplicate
      const response = await request(app)
        .post('/api/travel_plan/request_join')
        .set('Authorization', `Bearer ${token2}`)
        .send({ travel_plan_id: planId });

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('pending');
    });

    it('should reject approval when plan is full', async () => {
      // User2 requests to join first (while slots available)
      const joinRes = await request(app)
        .post('/api/travel_plan/request_join')
        .set('Authorization', `Bearer ${token2}`)
        .send({ travel_plan_id: planId });

      const participantId = joinRes.body.participant.participant_id;

      // Now set max_slots to 1 (only owner fits)
      await prisma.travel_plan.update({
        where: { travel_plan_id: planId },
        data: { max_slots: 1 }
      });

      // Try to approve - should fail (plan is full)
      const response = await request(app)
        .put(`/api/travel_plan/${planId}/approve/${participantId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('full');
    });
  });

  describe('Collaborator Safeguards', () => {
    let planId: number;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/travel_plan/create_plan')
        .set('Authorization', `Bearer ${token1}`)
        .send({ title: 'Collab Test Plan' });
      planId = res.body.travel_plan_id;
    });

    it('should prevent demoting last admin', async () => {
      // Try to demote user1 (the only admin)
      const response = await request(app)
        .put(`/api/travel_plan/${planId}/participants/${user1.user_id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ role: 'Editor' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('last admin');
    });

    it('should allow demotion when another admin exists', async () => {
      // Add user2 as Admin
      await request(app)
        .post(`/api/travel_plan/${planId}/participants`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ user_id: user2.user_id, role: 'Admin' });

      // Now demoting user1 should work
      const response = await request(app)
        .put(`/api/travel_plan/${planId}/participants/${user1.user_id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ role: 'Editor' });

      expect(response.status).toBe(200);
      expect(response.body.participant.role).toBe('Editor');
    });

    it('should count only approved participants for slots', async () => {
      // Set max_slots to 2
      await prisma.travel_plan.update({
        where: { travel_plan_id: planId },
        data: { max_slots: 2, visibility: true }
      });

      // Add user2 as pending (status: false)
      await prisma.participant.create({
        data: {
          travel_plan_id: planId,
          user_id: user2.user_id,
          role: 'Viewer',
          status: false
        }
      });

      // Adding user3 should succeed because user2 is pending
      const response = await request(app)
        .post(`/api/travel_plan/${planId}/participants`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ user_id: user3.user_id });

      expect(response.status).toBe(201);
    });
  });

  describe('Activity Date Shift', () => {
    let planId: number;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/travel_plan/create_plan')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'Activity Test Plan',
          start_date: '2025-08-01'
        });
      planId = res.body.travel_plan_id;

      // Create activities with location and budget data
      await request(app)
        .post('/api/travel_plan/create_activity')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          travel_plan_id: planId,
          notes: 'Activity 1',
          target_date: '2025-08-01',
          budget_range: '100-200',
          location: 'Beach Resort',
          lat: 14.5,
          lng: 120.9
        });

      await request(app)
        .post('/api/travel_plan/create_activity')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          travel_plan_id: planId,
          notes: 'Activity 2',
          target_date: '2025-08-02',
          budget_range: '200-400'
        });
    });

    it('should shift activity dates by offset', async () => {
      // Shift by 1 day (86400000 ms)
      const response = await request(app)
        .put(`/api/travel_plan/update_activity/${planId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ offset_ms: 86400000 });

      expect(response.status).toBe(200);
      expect(response.body.updated).toBe(2);
      expect(response.body.offset_applied_ms).toBe(86400000);
    });

    it('should return error for missing parameters', async () => {
      const response = await request(app)
        .put(`/api/travel_plan/update_activity/${planId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required parameter');
    });

    it('should create activity with normalized DTO response', async () => {
      const response = await request(app)
        .post('/api/travel_plan/create_activity')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          travel_plan_id: planId,
          notes: 'Test Activity',
          target_date: '2025-08-03',
          budget_range: '400-700',
          location: 'Test Location',
          name: 'Test Name',
          brgy: 'Test Brgy',
          city: 'Test City',
          province: 'Test Province',
          lat: 14.5,
          lng: 120.9
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toContain('successfully');
      expect(response.body).toHaveProperty('activity_id');
      expect(response.body).toHaveProperty('location', 'Test Location');
      expect(response.body).toHaveProperty('name', 'Test Name');
      expect(response.body).toHaveProperty('budget_range', '400-700');
      expect(response.body).toHaveProperty('lat', 14.5);
      expect(response.body).toHaveProperty('lng', 120.9);
    });

    it('should fetch activities with normalized DTO', async () => {
      const response = await request(app)
        .get(`/api/travel_plan/activities/${planId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
      
      const activity = response.body[0];
      expect(activity).toHaveProperty('activity_id');
      expect(activity).toHaveProperty('travel_plan_id');
      expect(activity).toHaveProperty('notes');
      expect(activity).toHaveProperty('target_date');
      expect(activity).toHaveProperty('budget_range');
      expect(activity).toHaveProperty('is_priority');
    });
  });

  describe('Create Plan with String Values', () => {
    it('should create plan with string slots (coerced to number)', async () => {
      const response = await request(app)
        .post('/api/travel_plan/create_plan')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'String Slots Test',
          description: 'Testing string to number coercion',
          location: 'Tagaytay',
          start_date: '2025-12-15',
          end_date: '2025-12-17',
          slots: '5' // String value should be coerced to number
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toContain('successfully');
      expect(response.body).toHaveProperty('travel_plan_id');
      expect(response.body).toHaveProperty('max_slots', 5);
      expect(response.body).toHaveProperty('slots', 5);
      expect(response.body).toHaveProperty('title', 'String Slots Test');
      expect(response.body).toHaveProperty('location', 'Tagaytay');
    });

    it('should create plan with max_slots string and collaborators', async () => {
      const response = await request(app)
        .post('/api/travel_plan/create_plan')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'Collaborators Test',
          max_slots: '10', // String value
          collaborators: [
            { user_id: user2.user_id, role: 'Editor', status: true },
            { user_id: user3.user_id, role: 'Viewer', status: false }
          ]
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('travel_plan_id');
      expect(response.body).toHaveProperty('max_slots', 10);

      // Verify participants were created
      const participants = await prisma.participant.findMany({
        where: { travel_plan_id: response.body.travel_plan_id }
      });

      // Should have 3 participants: creator + 2 collaborators
      expect(participants.length).toBe(3);
      
      // Verify creator is Admin with status true
      const creator = participants.find(p => p.user_id === user1.user_id);
      expect(creator?.role).toBe('Admin');
      expect(creator?.status).toBe(true);

      // Verify user2 is Editor with status true
      const editorParticipant = participants.find(p => p.user_id === user2.user_id);
      expect(editorParticipant?.role).toBe('Editor');
      expect(editorParticipant?.status).toBe(true);

      // Verify user3 is Viewer with status false (pending)
      const viewerParticipant = participants.find(p => p.user_id === user3.user_id);
      expect(viewerParticipant?.role).toBe('Viewer');
      expect(viewerParticipant?.status).toBe(false);
    });

    it('should reject invalid slots value', async () => {
      const response = await request(app)
        .post('/api/travel_plan/create_plan')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'Invalid Slots Test',
          slots: 'invalid' // Invalid string
        });

      expect(response.status).toBe(400);
    });

    it('should create plan without slots (null max_slots)', async () => {
      const response = await request(app)
        .post('/api/travel_plan/create_plan')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'No Slots Test',
          description: 'Plan without max_slots'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('travel_plan_id');
      expect(response.body.max_slots).toBeNull();
    });
  });

  describe('Public Plans', () => {
    beforeEach(async () => {
      // Create a visible plan
      const res = await request(app)
        .post('/api/travel_plan/create_plan')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'Public Plan Test',
          location: 'Palawan',
          max_slots: 10
        });

      await request(app)
        .put(`/api/travel_plan/edit_plan/${res.body.travel_plan_id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ visibility: true });
    });

    it('should list public plans without auth', async () => {
      const response = await request(app)
        .get('/api/travel_plan/public_plans');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should include slot availability in public plans with normalized DTO', async () => {
      const response = await request(app)
        .get('/api/travel_plan/public_plans');

      expect(response.status).toBe(200);
      const plan = response.body.data[0];
      expect(plan).toHaveProperty('approvedParticipants');
      expect(plan).toHaveProperty('slotsAvailable');
      
      // Verify normalized DTO fields
      expect(plan).toHaveProperty('id');
      expect(plan).toHaveProperty('travel_plan_id');
      expect(plan.id).toBe(plan.travel_plan_id);
      expect(plan).toHaveProperty('title');
      expect(plan).toHaveProperty('name');
      expect(plan).toHaveProperty('slots');
      expect(plan).toHaveProperty('max_slots');
      expect(plan).toHaveProperty('is_public', true);
      expect(plan).toHaveProperty('visibility', true);
    });

    it('should require auth to request joining', async () => {
      const response = await request(app)
        .post('/api/travel_plan/request_join')
        .send({ travel_plan_id: 1 });

      expect(response.status).toBe(401);
    });
  });
});

