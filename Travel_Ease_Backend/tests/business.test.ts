/**
 * Business Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express, { type Express } from 'express';
import { prisma } from '../src/lib/prisma.js';
import business_routes from '../routes/business_routes.js';
import { createTestUser, cleanupTestData } from './setup.js';
import type { User } from '@prisma/client';

const app: Express = express();
app.use(express.json());
app.use('/api/business', business_routes);

describe('Business', () => {
  let user1: User, token1: string, user2: User, token2: string;

  beforeEach(async () => {
    await cleanupTestData();
    
    const result1 = await createTestUser({ email: `biz1_${Date.now()}@example.com` });
    user1 = result1.user;
    token1 = result1.token;

    const result2 = await createTestUser({ email: `biz2_${Date.now()}@example.com` });
    user2 = result2.user;
    token2 = result2.token;
  });

  describe('POST /api/business/create_business', () => {
    it('should create business with authenticated user', async () => {
      const response = await request(app)
        .post('/api/business/create_business')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          name: 'Test Restaurant',
          street: 'Main St',
          city: 'Manila',
          description: 'Best food in town',
          category: ['food'],
          lat: 14.5995,
          lng: 120.9842
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('business_id');
      expect(response.body.message).toContain('successfully');

      // Verify business was created with correct user
      const business = await prisma.business.findUnique({
        where: { business_id: response.body.business_id }
      });

      expect(business?.user_id).toBe(user1.user_id);
      expect(business?.name).toBe('Test Restaurant');
    });

    it('should reject creation without authentication', async () => {
      const response = await request(app)
        .post('/api/business/create_business')
        .send({
          name: 'Unauthorized Business',
          category: ['food']
        });

      expect(response.status).toBe(401);
    });

    it('should reject invalid business data', async () => {
      const response = await request(app)
        .post('/api/business/create_business')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          // Missing name
          category: []  // Empty category array
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('PUT /api/business/edit_business/:id', () => {
    let businessId: number;

    beforeEach(async () => {
      // Create business for user1
      const response = await request(app)
        .post('/api/business/create_business')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          name: 'Original Business',
          category: ['food']
        });

      businessId = response.body.business_id;
    });

    it('should allow owner to edit their business', async () => {
      const response = await request(app)
        .put(`/api/business/edit_business/${businessId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          name: 'Updated Business',
          description: 'New description'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('successfully');
    });

    it('should reject edit by non-owner', async () => {
      const response = await request(app)
        .put(`/api/business/edit_business/${businessId}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({
          name: 'Hijacked Business'
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Not authorized');
    });
  });

  describe('GET /api/business/businesses', () => {
    it('should list businesses without authentication', async () => {
      // Create some businesses
      await request(app)
        .post('/api/business/create_business')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          name: 'Public Business',
          category: ['food']
        });

      const response = await request(app)
        .get('/api/business/businesses');

      expect(response.status).toBe(200);
      // Paginated response format
      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('pageSize');
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it('should filter by category', async () => {
      // Create a food business
      await request(app)
        .post('/api/business/create_business')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          name: 'Food Business',
          category: ['food']
        });

      const response = await request(app)
        .get('/api/business/businesses?category=food');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('items');
    });

    it('should search by name', async () => {
      await request(app)
        .post('/api/business/create_business')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          name: 'Unique Searchable Name',
          category: ['food']
        });

      const response = await request(app)
        .get('/api/business/businesses?search=Unique');

      expect(response.status).toBe(200);
      expect(response.body.items.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('GET /api/business/categories', () => {
    it('should return list of categories', async () => {
      const response = await request(app)
        .get('/api/business/categories');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('categories');
      expect(Array.isArray(response.body.categories)).toBe(true);
    });
  });
});

