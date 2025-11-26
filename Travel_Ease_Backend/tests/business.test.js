/**
 * Business Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { prisma } from '../src/lib/prisma.js';
import business_routes from '../routes/business_routes.js';
import { createTestUser, cleanupTestData } from './setup.js';

const app = express();
app.use(express.json());
app.use('/api/business', business_routes);

describe('Business', () => {
  let user1, token1, user2, token2;

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

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('business_id');
      expect(response.body.message).toContain('successfully');

      // Verify business was created with correct user
      const business = await prisma.business.findUnique({
        where: { business_id: response.body.business_id }
      });

      expect(business.user_id).toBe(user1.user_id);
      expect(business.name).toBe('Test Restaurant');
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
    let businessId;

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
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
