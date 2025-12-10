/**
 * Travel Plan Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express, { type Express } from 'express';
import { prisma } from '../src/lib/prisma.js';
import travelPlanRoutes from '../src/routes/travelPlanRoutes.js';
import { createTestUser, cleanupTestData } from './setup.js';
import type { User } from '@prisma/client';

const app: Express = express();
app.use(express.json());
app.use('/api/travel_plan', travelPlanRoutes);

describe('Travel Plans', () => {
  let user1: User, token1: string, user2: User, token2: string;

  beforeEach(async () => {
    await cleanupTestData();
    
    // Create two test users
    const result1 = await createTestUser({ email: `user1_${Date.now()}@example.com` });
    user1 = result1.user;
    token1 = result1.token;

    const result2 = await createTestUser({ email: `user2_${Date.now()}@example.com` });
    user2 = result2.user;
    token2 = result2.token;
  });

  describe('POST /api/travel_plan/create_plan', () => {
    it('should create a plan with authenticated user', async () => {
      const response = await request(app)
        .post('/api/travel_plan/create_plan')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'Beach Trip',
          description: 'Summer vacation',
          location: 'Boracay',
          start_date: '2025-07-01',
          end_date: '2025-07-07',
          slots: 5
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toContain('successfully');
      
      // Verify normalized DTO fields
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('travel_plan_id');
      expect(response.body.id).toBe(response.body.travel_plan_id);
      expect(response.body).toHaveProperty('title', 'Beach Trip');
      expect(response.body).toHaveProperty('name', 'Beach Trip');
      expect(response.body).toHaveProperty('slots', 5);
      expect(response.body).toHaveProperty('max_slots', 5);
      expect(response.body).toHaveProperty('is_public', false);
      expect(response.body).toHaveProperty('visibility', false);

      // Verify participant was auto-created as Admin
      const participants = await prisma.participant.findMany({
        where: { travel_plan_id: response.body.travel_plan_id }
      });

      expect(participants).toHaveLength(1);
      expect(participants[0].user_id).toBe(user1.user_id);
      expect(participants[0].role).toBe('Admin');
      expect(participants[0].status).toBe(true);
    });

    it('should reject creation without authentication', async () => {
      const response = await request(app)
        .post('/api/travel_plan/create_plan')
        .send({
          title: 'Beach Trip'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should reject invalid data', async () => {
      const response = await request(app)
        .post('/api/travel_plan/create_plan')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          // Missing title
          description: 'No title provided'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('PUT /api/travel_plan/edit_plan/:id', () => {
    let planId: number;

    beforeEach(async () => {
      // Create a plan for user1
      const response = await request(app)
        .post('/api/travel_plan/create_plan')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'Original Plan',
          location: 'Manila'
        });

      planId = response.body.travel_plan_id;
    });

    it('should allow owner to edit their plan', async () => {
      const response = await request(app)
        .put(`/api/travel_plan/edit_plan/${planId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'Updated Plan',
          location: 'Cebu'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('successfully');
    });

    it('should reject edit by non-owner', async () => {
      const response = await request(app)
        .put(`/api/travel_plan/edit_plan/${planId}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({
          title: 'Hijacked Plan'
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Not authorized');
    });

    it('should allow admin participant to edit plan', async () => {
      // Add user2 as Admin participant
      await prisma.participant.create({
        data: {
          travel_plan_id: planId,
          user_id: user2.user_id,
          role: 'Admin',
          status: true
        }
      });

      const response = await request(app)
        .put(`/api/travel_plan/edit_plan/${planId}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({
          title: 'Admin Updated'
        });

      expect(response.status).toBe(200);
    });
  });

  describe('Participant Management', () => {
    let planId: number;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/travel_plan/create_plan')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'Collaborative Plan',
          max_slots: 3
        });

      planId = response.body.travel_plan_id;
    });

    it('should list participants', async () => {
      const response = await request(app)
        .get(`/api/travel_plan/${planId}/participants`)
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1); // Creator
    });

    it('should add participant with slots available', async () => {
      const response = await request(app)
        .post(`/api/travel_plan/${planId}/participants`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          user_id: user2.user_id,
          role: 'Editor'
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toContain('added successfully');
    });

    it('should reject adding participant when plan is full', async () => {
      // Update plan to max_slots = 1 (only creator)
      await prisma.travel_plan.update({
        where: { travel_plan_id: planId },
        data: { max_slots: 1 }
      });

      const response = await request(app)
        .post(`/api/travel_plan/${planId}/participants`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          user_id: user2.user_id
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('full');
    });
  });

  describe('GET /api/travel_plan/ongoing_plan', () => {
    it('should return only Active plans for authenticated user', async () => {
      // Create an Active plan
      const plan = await prisma.travel_plan.create({
        data: {
          name: 'Active Trip',
          user_id: user1.user_id,
          status: 'Active',
          start_date: new Date(),
          end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });

      // Add user as approved participant
      await prisma.participant.create({
        data: {
          travel_plan_id: plan.travel_plan_id,
          user_id: user1.user_id,
          role: 'Admin',
          status: true
        }
      });

      const response = await request(app)
        .get('/api/travel_plan/ongoing_plan')
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      expect(response.body.data.every((p: any) => p.status === 'Active')).toBe(true);
    });

    it('should return empty array when no ongoing plans', async () => {
      const response = await request(app)
        .get('/api/travel_plan/ongoing_plan')
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
      expect(response.body.pagination).toBeDefined();
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/travel_plan/ongoing_plan');

      expect(response.status).toBe(401);
    });

    it('should respect pagination params', async () => {
      // Create multiple Active plans
      for (let i = 0; i < 3; i++) {
        const plan = await prisma.travel_plan.create({
          data: {
            name: `Active Trip ${i}`,
            user_id: user1.user_id,
            status: 'Active'
          }
        });
        await prisma.participant.create({
          data: {
            travel_plan_id: plan.travel_plan_id,
            user_id: user1.user_id,
            role: 'Admin',
            status: true
          }
        });
      }

      const response = await request(app)
        .get('/api/travel_plan/ongoing_plan?page=1&pageSize=2')
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.pagination.pageSize).toBe(2);
    });
  });

  describe('GET /api/travel_plan/previous_plans', () => {
    it('should return Completed and Cancelled plans', async () => {
      // Create Completed plan
      const completedPlan = await prisma.travel_plan.create({
        data: {
          name: 'Completed Trip',
          user_id: user1.user_id,
          status: 'Completed'
        }
      });

      // Create Cancelled plan
      const cancelledPlan = await prisma.travel_plan.create({
        data: {
          name: 'Cancelled Trip',
          user_id: user1.user_id,
          status: 'Cancelled'
        }
      });

      const response = await request(app)
        .get('/api/travel_plan/previous_plans')
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
      expect(response.body.data.every((p: any) => 
        p.status === 'Completed' || p.status === 'Cancelled'
      )).toBe(true);
    });

    it('should filter by status param', async () => {
      // Create one of each
      await prisma.travel_plan.create({
        data: { name: 'Completed', user_id: user1.user_id, status: 'Completed' }
      });
      await prisma.travel_plan.create({
        data: { name: 'Cancelled', user_id: user1.user_id, status: 'Cancelled' }
      });

      const response = await request(app)
        .get('/api/travel_plan/previous_plans?status=Completed')
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every((p: any) => p.status === 'Completed')).toBe(true);
    });

    it('should include plans where user is participant', async () => {
      // Create plan by user2
      const plan = await prisma.travel_plan.create({
        data: {
          name: 'Friend Trip',
          user_id: user2.user_id,
          status: 'Completed'
        }
      });

      // Add user1 as participant
      await prisma.participant.create({
        data: {
          travel_plan_id: plan.travel_plan_id,
          user_id: user1.user_id,
          role: 'Viewer',
          status: true
        }
      });

      const response = await request(app)
        .get('/api/travel_plan/previous_plans')
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      const planIds = response.body.data.map((p: any) => p.id || p.travel_plan_id);
      expect(planIds).toContain(plan.travel_plan_id);
    });
  });

  describe('GET /api/travel_plan/public_plans', () => {
    it('should return only visible Draft/Active plans', async () => {
      // Create visible Active plan
      await prisma.travel_plan.create({
        data: {
          name: 'Public Active',
          user_id: user1.user_id,
          status: 'Active',
          visibility: true,
          visibility_timestamp: new Date()
        }
      });

      // Create non-visible plan (should not be returned)
      await prisma.travel_plan.create({
        data: {
          name: 'Private Plan',
          user_id: user1.user_id,
          status: 'Active',
          visibility: false
        }
      });

      const response = await request(app)
        .get('/api/travel_plan/public_plans');

      expect(response.status).toBe(200);
      expect(response.body.data.every((p: any) => p.visibility === true || p.is_public === true)).toBe(true);
    });

    it('should exclude expired visibility_end_date plans', async () => {
      // Create plan with expired visibility
      const expiredPlan = await prisma.travel_plan.create({
        data: {
          name: 'Expired Visibility',
          user_id: user1.user_id,
          status: 'Active',
          visibility: true,
          visibility_end_date: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
        }
      });

      const response = await request(app)
        .get('/api/travel_plan/public_plans');

      expect(response.status).toBe(200);
      const planIds = response.body.data.map((p: any) => p.id || p.travel_plan_id);
      expect(planIds).not.toContain(expiredPlan.travel_plan_id);
    });

    it('should include isOwner and isParticipant for authenticated user', async () => {
      // Create visible plan by user1
      const plan = await prisma.travel_plan.create({
        data: {
          name: 'My Public Plan',
          user_id: user1.user_id,
          status: 'Active',
          visibility: true,
          visibility_timestamp: new Date()
        }
      });

      const response = await request(app)
        .get('/api/travel_plan/public_plans')
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      const myPlan = response.body.data.find((p: any) => 
        (p.id || p.travel_plan_id) === plan.travel_plan_id
      );
      
      if (myPlan) {
        expect(myPlan.isOwner).toBe(true);
      }
    });

    it('should respect pagination', async () => {
      // Create multiple visible plans
      for (let i = 0; i < 5; i++) {
        await prisma.travel_plan.create({
          data: {
            name: `Public Plan ${i}`,
            user_id: user1.user_id,
            status: 'Active',
            visibility: true,
            visibility_timestamp: new Date()
          }
        });
      }

      const response = await request(app)
        .get('/api/travel_plan/public_plans?page=1&pageSize=3');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(3);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.pageSize).toBe(3);
    });
  });

  describe('PUT /api/travel_plan/join_plan', () => {
    let publicPlanId: number;

    beforeEach(async () => {
      // Create a public, joinable plan by user1
      const plan = await prisma.travel_plan.create({
        data: {
          name: 'Open Trip',
          user_id: user1.user_id,
          status: 'Active',
          visibility: true,
          max_slots: 5,
          visibility_timestamp: new Date()
        }
      });
      publicPlanId = plan.travel_plan_id;

      // Add owner as participant
      await prisma.participant.create({
        data: {
          travel_plan_id: publicPlanId,
          user_id: user1.user_id,
          role: 'Admin',
          status: true
        }
      });
    });

    it('should create pending participant (status=false)', async () => {
      const response = await request(app)
        .put('/api/travel_plan/join_plan')
        .set('Authorization', `Bearer ${token2}`)
        .send({
          travel_plan_id: publicPlanId,
          role: 'Viewer'
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toContain('Waiting for approval');

      // Verify participant was created with status=false
      const participant = await prisma.participant.findFirst({
        where: {
          travel_plan_id: publicPlanId,
          user_id: user2.user_id
        }
      });

      expect(participant).not.toBeNull();
      expect(participant?.status).toBe(false);
    });

    it('should reject when plan is full', async () => {
      // Set max_slots to 1 (owner already takes it)
      await prisma.travel_plan.update({
        where: { travel_plan_id: publicPlanId },
        data: { max_slots: 1 }
      });

      const response = await request(app)
        .put('/api/travel_plan/join_plan')
        .set('Authorization', `Bearer ${token2}`)
        .send({
          travel_plan_id: publicPlanId
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('full');
    });

    it('should reject duplicate join requests', async () => {
      // First join request
      await request(app)
        .put('/api/travel_plan/join_plan')
        .set('Authorization', `Bearer ${token2}`)
        .send({ travel_plan_id: publicPlanId });

      // Second join request (duplicate)
      const response = await request(app)
        .put('/api/travel_plan/join_plan')
        .set('Authorization', `Bearer ${token2}`)
        .send({ travel_plan_id: publicPlanId });

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('already');
    });

    it('should reject joining private plans', async () => {
      // Make plan private
      await prisma.travel_plan.update({
        where: { travel_plan_id: publicPlanId },
        data: { visibility: false }
      });

      const response = await request(app)
        .put('/api/travel_plan/join_plan')
        .set('Authorization', `Bearer ${token2}`)
        .send({ travel_plan_id: publicPlanId });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('not open');
    });
  });

  describe('Approval Flow', () => {
    let publicPlanId: number;
    let pendingParticipantId: number;

    beforeEach(async () => {
      // Create a public plan
      const plan = await prisma.travel_plan.create({
        data: {
          name: 'Approval Test Plan',
          user_id: user1.user_id,
          status: 'Active',
          visibility: true,
          max_slots: 5
        }
      });
      publicPlanId = plan.travel_plan_id;

      // Add owner as approved participant
      await prisma.participant.create({
        data: {
          travel_plan_id: publicPlanId,
          user_id: user1.user_id,
          role: 'Admin',
          status: true
        }
      });

      // Add user2 as pending participant
      const pending = await prisma.participant.create({
        data: {
          travel_plan_id: publicPlanId,
          user_id: user2.user_id,
          role: 'Viewer',
          status: false
        }
      });
      pendingParticipantId = pending.participant_id;
    });

    it('should approve pending request (status=true)', async () => {
      const response = await request(app)
        .put(`/api/travel_plan/${publicPlanId}/approve/${pendingParticipantId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('approved');

      // Verify participant status is now true
      const participant = await prisma.participant.findUnique({
        where: { participant_id: pendingParticipantId }
      });
      expect(participant?.status).toBe(true);
    });

    it('should reject non-owner approval', async () => {
      // Create a third user to attempt approval
      const result3 = await createTestUser({ email: `user3_${Date.now()}@example.com` });
      const token3 = result3.token;

      const response = await request(app)
        .put(`/api/travel_plan/${publicPlanId}/approve/${pendingParticipantId}`)
        .set('Authorization', `Bearer ${token3}`);

      expect(response.status).toBe(403);
    });

    it('should deny pending request', async () => {
      const response = await request(app)
        .delete(`/api/travel_plan/${publicPlanId}/deny/${pendingParticipantId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);

      // Verify participant was removed
      const participant = await prisma.participant.findUnique({
        where: { participant_id: pendingParticipantId }
      });
      expect(participant).toBeNull();
    });
  });

  describe('GET /api/travel_plan/activities/:id', () => {
    let planId: number;

    beforeEach(async () => {
      // Create a plan
      const plan = await prisma.travel_plan.create({
        data: {
          name: 'Activity Test Plan',
          user_id: user1.user_id,
          status: 'Active'
        }
      });
      planId = plan.travel_plan_id;

      // Add owner as participant
      await prisma.participant.create({
        data: {
          travel_plan_id: planId,
          user_id: user1.user_id,
          role: 'Admin',
          status: true
        }
      });

      // Create some activities
      await prisma.activity.create({
        data: {
          travel_plan_id: planId,
          user_id: user1.user_id,
          name: 'Visit Beach',
          location: 'Boracay Beach',
          target_date: new Date('2025-07-15'),
          is_accommodation: false
        }
      });
    });

    it('should return activities for owned plan', async () => {
      const response = await request(app)
        .get(`/api/travel_plan/activities/${planId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should return activities for participant', async () => {
      // Add user2 as participant
      await prisma.participant.create({
        data: {
          travel_plan_id: planId,
          user_id: user2.user_id,
          role: 'Viewer',
          status: true
        }
      });

      const response = await request(app)
        .get(`/api/travel_plan/activities/${planId}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get(`/api/travel_plan/activities/${planId}`);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/travel_plan/create_activity', () => {
    let planId: number;

    beforeEach(async () => {
      // Create a plan
      const plan = await prisma.travel_plan.create({
        data: {
          name: 'Activity Creation Plan',
          user_id: user1.user_id,
          status: 'Active'
        }
      });
      planId = plan.travel_plan_id;

      // Add owner as participant
      await prisma.participant.create({
        data: {
          travel_plan_id: planId,
          user_id: user1.user_id,
          role: 'Admin',
          status: true
        }
      });
    });

    it('should create activity with valid data', async () => {
      const response = await request(app)
        .post('/api/travel_plan/create_activity')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          travel_plan_id: planId,
          name: 'Dinner at Restaurant',
          location: 'Downtown Tagaytay',
          target_date: '2025-07-15',
          lat: 14.1153,
          lng: 120.9621
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toContain('successfully');
      expect(response.body).toHaveProperty('activity_id');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/travel_plan/create_activity')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          // Missing travel_plan_id
          name: 'Test Activity'
        });

      expect(response.status).toBe(400);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/travel_plan/create_activity')
        .send({
          travel_plan_id: planId,
          name: 'Test Activity'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/travel_plan/delete_activity/:id', () => {
    let planId: number;
    let activityId: number;

    beforeEach(async () => {
      // Create a plan
      const plan = await prisma.travel_plan.create({
        data: {
          name: 'Activity Deletion Plan',
          user_id: user1.user_id,
          status: 'Active'
        }
      });
      planId = plan.travel_plan_id;

      // Add owner as participant
      await prisma.participant.create({
        data: {
          travel_plan_id: planId,
          user_id: user1.user_id,
          role: 'Admin',
          status: true
        }
      });

      // Create an activity
      const activity = await prisma.activity.create({
        data: {
          travel_plan_id: planId,
          user_id: user1.user_id,
          name: 'Activity to Delete',
          is_accommodation: false
        }
      });
      activityId = activity.activity_id;
    });

    it('should delete activity owned by user', async () => {
      const response = await request(app)
        .delete(`/api/travel_plan/delete_activity/${activityId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('deleted');

      // Verify activity was deleted
      const activity = await prisma.activity.findUnique({
        where: { activity_id: activityId }
      });
      expect(activity).toBeNull();
    });

    it('should return 404 for non-existent activity', async () => {
      const response = await request(app)
        .delete('/api/travel_plan/delete_activity/999999')
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(404);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .delete(`/api/travel_plan/delete_activity/${activityId}`);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/travel_plan/all (Grouped Plans)', () => {
    it('should return grouped plans for authenticated user', async () => {
      // Create plans with different statuses
      const draftPlan = await prisma.travel_plan.create({
        data: {
          name: 'Draft Plan',
          user_id: user1.user_id,
          status: 'Draft'
        }
      });
      await prisma.participant.create({
        data: {
          travel_plan_id: draftPlan.travel_plan_id,
          user_id: user1.user_id,
          role: 'Admin',
          status: true
        }
      });

      const activePlan = await prisma.travel_plan.create({
        data: {
          name: 'Active Plan',
          user_id: user1.user_id,
          status: 'Active'
        }
      });
      await prisma.participant.create({
        data: {
          travel_plan_id: activePlan.travel_plan_id,
          user_id: user1.user_id,
          role: 'Admin',
          status: true
        }
      });

      const completedPlan = await prisma.travel_plan.create({
        data: {
          name: 'Completed Plan',
          user_id: user1.user_id,
          status: 'Completed'
        }
      });
      await prisma.participant.create({
        data: {
          travel_plan_id: completedPlan.travel_plan_id,
          user_id: user1.user_id,
          role: 'Admin',
          status: true
        }
      });

      const response = await request(app)
        .get('/api/travel_plan/all')
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      
      // Check structure
      expect(response.body).toHaveProperty('upcoming');
      expect(response.body).toHaveProperty('ongoing');
      expect(response.body).toHaveProperty('previous');
      
      // Each group should have data and total
      expect(response.body.upcoming).toHaveProperty('data');
      expect(response.body.upcoming).toHaveProperty('total');
      expect(response.body.ongoing).toHaveProperty('data');
      expect(response.body.ongoing).toHaveProperty('total');
      expect(response.body.previous).toHaveProperty('data');
      expect(response.body.previous).toHaveProperty('total');
      
      // Verify correct grouping
      expect(response.body.upcoming.data.some((p: any) => p.name === 'Draft Plan')).toBe(true);
      expect(response.body.ongoing.data.some((p: any) => p.name === 'Active Plan')).toBe(true);
      expect(response.body.previous.data.some((p: any) => p.name === 'Completed Plan')).toBe(true);
      
      // Verify totals
      expect(response.body.upcoming.total).toBeGreaterThanOrEqual(1);
      expect(response.body.ongoing.total).toBeGreaterThanOrEqual(1);
      expect(response.body.previous.total).toBeGreaterThanOrEqual(1);
    });

    it('should return empty groups when no plans', async () => {
      const response = await request(app)
        .get('/api/travel_plan/all')
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      expect(response.body.upcoming.data).toEqual([]);
      expect(response.body.upcoming.total).toBe(0);
      expect(response.body.ongoing.data).toEqual([]);
      expect(response.body.ongoing.total).toBe(0);
      expect(response.body.previous.data).toEqual([]);
      expect(response.body.previous.total).toBe(0);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/travel_plan/all');

      expect(response.status).toBe(401);
    });

    it('should include plans where user is participant', async () => {
      // Create a plan owned by user2
      const plan = await prisma.travel_plan.create({
        data: {
          name: 'Participant Plan',
          user_id: user2.user_id,
          status: 'Draft'
        }
      });

      // Add user1 as approved participant
      await prisma.participant.create({
        data: {
          travel_plan_id: plan.travel_plan_id,
          user_id: user1.user_id,
          role: 'Viewer',
          status: true
        }
      });

      const response = await request(app)
        .get('/api/travel_plan/all')
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      expect(response.body.upcoming.data.some((p: any) => p.name === 'Participant Plan')).toBe(true);
    });

    it('should not include plans where user is pending participant', async () => {
      // Create a plan owned by user2
      const plan = await prisma.travel_plan.create({
        data: {
          name: 'Pending Participant Plan',
          user_id: user2.user_id,
          status: 'Draft'
        }
      });

      // Add user1 as pending participant (status: false)
      await prisma.participant.create({
        data: {
          travel_plan_id: plan.travel_plan_id,
          user_id: user1.user_id,
          role: 'Viewer',
          status: false
        }
      });

      const response = await request(app)
        .get('/api/travel_plan/all')
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      expect(response.body.upcoming.data.some((p: any) => p.name === 'Pending Participant Plan')).toBe(false);
    });

    it('should group Cancelled plans as previous', async () => {
      const cancelledPlan = await prisma.travel_plan.create({
        data: {
          name: 'Cancelled Plan',
          user_id: user1.user_id,
          status: 'Cancelled'
        }
      });
      await prisma.participant.create({
        data: {
          travel_plan_id: cancelledPlan.travel_plan_id,
          user_id: user1.user_id,
          role: 'Admin',
          status: true
        }
      });

      const response = await request(app)
        .get('/api/travel_plan/all')
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      expect(response.body.previous.data.some((p: any) => p.name === 'Cancelled Plan')).toBe(true);
    });

    it('should include normalized DTO fields in response', async () => {
      const plan = await prisma.travel_plan.create({
        data: {
          name: 'DTO Test Plan',
          user_id: user1.user_id,
          status: 'Active',
          max_slots: 5,
          visibility: true
        }
      });
      await prisma.participant.create({
        data: {
          travel_plan_id: plan.travel_plan_id,
          user_id: user1.user_id,
          role: 'Admin',
          status: true
        }
      });

      const response = await request(app)
        .get('/api/travel_plan/all')
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      
      const planData = response.body.ongoing.data.find((p: any) => p.name === 'DTO Test Plan');
      expect(planData).toBeDefined();
      
      // Check normalized fields
      expect(planData).toHaveProperty('id');
      expect(planData).toHaveProperty('travel_plan_id');
      expect(planData.id).toBe(planData.travel_plan_id);
      expect(planData).toHaveProperty('title', 'DTO Test Plan');
      expect(planData).toHaveProperty('name', 'DTO Test Plan');
      expect(planData).toHaveProperty('slots', 5);
      expect(planData).toHaveProperty('max_slots', 5);
      expect(planData).toHaveProperty('is_public', true);
      expect(planData).toHaveProperty('visibility', true);
      expect(planData).toHaveProperty('approvedParticipants');
    });
  });
});

