/**
 * Participant Management Tests
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

describe('Participant Management', () => {
  let user1: User, token1: string;
  let user2: User, token2: string;
  let user3: User, token3: string;
  let planId: number;

  beforeEach(async () => {
    await cleanupTestData();

    const result1 = await createTestUser({ email: `part1_${Date.now()}@example.com` });
    user1 = result1.user;
    token1 = result1.token;

    const result2 = await createTestUser({ email: `part2_${Date.now()}@example.com` });
    user2 = result2.user;
    token2 = result2.token;

    const result3 = await createTestUser({ email: `part3_${Date.now()}@example.com` });
    user3 = result3.user;
    token3 = result3.token;

    // Create plan with user1 as owner
    const response = await request(app)
      .post('/api/travel_plan/create_plan')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        title: 'Participant Test Plan',
        max_slots: 5
      });
    planId = response.body.travel_plan_id;
  });

  describe('Add Participant', () => {
    it('should add participant as owner', async () => {
      const response = await request(app)
        .post(`/api/travel_plan/${planId}/participants`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          user_id: user2.user_id,
          role: 'Editor'
        });

      expect(response.status).toBe(201);
      expect(response.body.participant.role).toBe('Editor');
    });

    it('should reject adding duplicate participant', async () => {
      // Add first time
      await request(app)
        .post(`/api/travel_plan/${planId}/participants`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ user_id: user2.user_id });

      // Try to add again
      const response = await request(app)
        .post(`/api/travel_plan/${planId}/participants`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ user_id: user2.user_id });

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('already a participant');
    });

    it('should reject add by non-owner', async () => {
      const response = await request(app)
        .post(`/api/travel_plan/${planId}/participants`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ user_id: user3.user_id });

      expect(response.status).toBe(403);
    });

    it('should reject invalid user_id', async () => {
      const response = await request(app)
        .post(`/api/travel_plan/${planId}/participants`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ user_id: -1 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('Update Participant', () => {
    beforeEach(async () => {
      // Add user2 as participant
      await request(app)
        .post(`/api/travel_plan/${planId}/participants`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ user_id: user2.user_id, role: 'Viewer' });
    });

    it('should update participant role', async () => {
      const response = await request(app)
        .put(`/api/travel_plan/${planId}/participants/${user2.user_id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ role: 'Admin' });

      expect(response.status).toBe(200);
      expect(response.body.participant.role).toBe('Admin');
    });

    it('should approve participant', async () => {
      const response = await request(app)
        .put(`/api/travel_plan/${planId}/participants/${user2.user_id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ status: true });

      expect(response.status).toBe(200);
      expect(response.body.participant.status).toBe(true);
    });

    it('should reject invalid role', async () => {
      const response = await request(app)
        .put(`/api/travel_plan/${planId}/participants/${user2.user_id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ role: 'InvalidRole' });

      expect(response.status).toBe(400);
    });
  });

  describe('Remove Participant', () => {
    beforeEach(async () => {
      // Add user2 as participant
      await request(app)
        .post(`/api/travel_plan/${planId}/participants`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ user_id: user2.user_id });
    });

    it('should remove participant as owner', async () => {
      const response = await request(app)
        .delete(`/api/travel_plan/${planId}/participants/${user2.user_id}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('removed');
    });

    it('should prevent removing last admin', async () => {
      const response = await request(app)
        .delete(`/api/travel_plan/${planId}/participants/${user1.user_id}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('last admin');
    });
  });

  describe('Join Plan', () => {
    it('should allow user to join visible plan', async () => {
      // Make plan visible
      await prisma.travel_plan.update({
        where: { travel_plan_id: planId },
        data: { visibility: true }
      });

      const response = await request(app)
        .put('/api/travel_plan/join_plan')
        .set('Authorization', `Bearer ${token2}`)
        .send({
          travel_plan_id: planId,
          role: 'Viewer'
        });

      expect(response.status).toBe(201);
    });

    it('should reject join without travel_plan_id', async () => {
      const response = await request(app)
        .put('/api/travel_plan/join_plan')
        .set('Authorization', `Bearer ${token2}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should reject unauthenticated join', async () => {
      const response = await request(app)
        .put('/api/travel_plan/join_plan')
        .send({ travel_plan_id: planId });

      expect(response.status).toBe(401);
    });
  });

  describe('Slot Limits', () => {
    it('should reject participant when plan is full', async () => {
      // Update plan to max_slots = 1 (owner only)
      await prisma.travel_plan.update({
        where: { travel_plan_id: planId },
        data: { max_slots: 1 }
      });

      const response = await request(app)
        .post(`/api/travel_plan/${planId}/participants`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ user_id: user2.user_id });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('full');
    });
  });
});

