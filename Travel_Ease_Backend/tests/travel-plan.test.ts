/**
 * Travel Plan Tests
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
      await prisma.travelPlan.update({
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
});

