/**
 * Favorites Tests - Uniqueness and duplicate handling
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express, { type Express } from 'express';
import { prisma } from '../src/lib/prisma.js';
import user_routes from '../routes/user_routes.js';
import business_routes from '../routes/business_routes.js';
import travel_plan_routes from '../routes/travel_plan_routes.js';
import { createTestUser, cleanupTestData } from './setup.js';
import type { User } from '@prisma/client';

const app: Express = express();
app.use(express.json());
app.use('/api/user', user_routes);
app.use('/api/business', business_routes);
app.use('/api/travel_plan', travel_plan_routes);

describe('Favorites', () => {
  let user1: User, token1: string;
  let businessId: number, planId: number;

  beforeEach(async () => {
    await cleanupTestData();

    const result1 = await createTestUser({ email: `fav1_${Date.now()}@example.com` });
    user1 = result1.user;
    token1 = result1.token;

    // Create a business
    const bizResponse = await request(app)
      .post('/api/business/create_business')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        name: 'Test Favorite Business',
        category: ['food']
      });
    businessId = bizResponse.body.business_id;

    // Create a travel plan
    const planResponse = await request(app)
      .post('/api/travel_plan/create_plan')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        title: 'Test Favorite Plan'
      });
    planId = planResponse.body.travel_plan_id;
  });

  describe('Business Favorites', () => {
    it('should add business to favorites', async () => {
      const response = await request(app)
        .post('/api/user/favorite')
        .set('Authorization', `Bearer ${token1}`)
        .send({ business_id: businessId });

      expect(response.status).toBe(201);
      expect(response.body.message).toContain('favorites');
    });

    it('should reject duplicate business favorite', async () => {
      // Add first time
      await request(app)
        .post('/api/user/favorite')
        .set('Authorization', `Bearer ${token1}`)
        .send({ business_id: businessId });

      // Try to add again
      const response = await request(app)
        .post('/api/user/favorite')
        .set('Authorization', `Bearer ${token1}`)
        .send({ business_id: businessId });

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('Already in favorites');
    });

    it('should list user favorites', async () => {
      // Add favorite
      await request(app)
        .post('/api/user/favorite')
        .set('Authorization', `Bearer ${token1}`)
        .send({ business_id: businessId });

      // Get favorites
      const response = await request(app)
        .get(`/api/user/favorite/${user1.user_id}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      expect(response.body.business_favorites).toHaveLength(1);
      expect(response.body.business_favorites[0].business.business_id).toBe(businessId);
    });
  });

  describe('Travel Plan Favorites', () => {
    it('should add travel plan to favorites', async () => {
      const response = await request(app)
        .post('/api/user/favorite')
        .set('Authorization', `Bearer ${token1}`)
        .send({ travel_plan_id: planId });

      expect(response.status).toBe(201);
      expect(response.body.message).toContain('favorites');
    });

    it('should reject duplicate travel plan favorite', async () => {
      // Add first time
      await request(app)
        .post('/api/user/favorite')
        .set('Authorization', `Bearer ${token1}`)
        .send({ travel_plan_id: planId });

      // Try to add again
      const response = await request(app)
        .post('/api/user/favorite')
        .set('Authorization', `Bearer ${token1}`)
        .send({ travel_plan_id: planId });

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('Already in favorites');
    });
  });

  describe('Favorite Validation', () => {
    it('should reject favorite without target', async () => {
      const response = await request(app)
        .post('/api/user/favorite')
        .set('Authorization', `Bearer ${token1}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should reject favorite without authentication', async () => {
      const response = await request(app)
        .post('/api/user/favorite')
        .send({ business_id: businessId });

      expect(response.status).toBe(401);
    });
  });
});

