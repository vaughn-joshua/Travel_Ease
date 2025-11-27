/**
 * Authentication Tests
 * 
 * Note: Registration and login use Supabase Auth in production.
 * These tests verify validation, middleware, and protected routes.
 * For Supabase integration tests, use a test Supabase instance.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { prisma } from '../src/lib/prisma.js';
import user_routes from '../routes/user_routes.js';
import { createTestUser } from './setup.js';
import { errorHandler } from '../src/middleware/errorHandler.js';

const app = express();
app.use(express.json());
app.use('/api/user', user_routes);
app.use(errorHandler);

describe('Authentication', () => {
  describe('POST /api/user/register - Validation', () => {
    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/user/register')
        .send({
          first_name: 'John',
          last_name: 'Doe',
          email: 'invalid-email',
          password: 'SecurePass123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should reject short password', async () => {
      const response = await request(app)
        .post('/api/user/register')
        .send({
          first_name: 'John',
          last_name: 'Doe',
          email: 'test@example.com',
          password: '123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should reject missing first_name', async () => {
      const response = await request(app)
        .post('/api/user/register')
        .send({
          last_name: 'Doe',
          email: 'test@example.com',
          password: 'SecurePass123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('POST /api/user/login - Validation', () => {
    it('should reject missing email', async () => {
      const response = await request(app)
        .post('/api/user/login')
        .send({
          password: 'testpassword'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should reject missing password', async () => {
      const response = await request(app)
        .post('/api/user/login')
        .send({
          email: 'test@example.com'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('Protected Routes', () => {
    let authToken;
    let userId;
    let testEmail;

    beforeEach(async () => {
      // Create test user with local JWT for testing (unique email per test)
      testEmail = `protected_test_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;
      const { user, token } = await createTestUser({ email: testEmail });
      authToken = token;
      userId = user.user_id;
    });

    it('should access user profile with valid token', async () => {
      const response = await request(app)
        .get(`/api/user/user/${userId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.email).toBe(testEmail);
    });

    it('should reject access without token', async () => {
      const response = await request(app)
        .get(`/api/user/user/${userId}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should reject access with invalid token', async () => {
      const response = await request(app)
        .get(`/api/user/user/${userId}`)
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Invalid or expired token');
    });
  });

  describe('Favorites', () => {
    let authToken;
    let userId;
    let businessId;
    let testEmail;

    beforeEach(async () => {
      // Unique email per test
      testEmail = `favorites_test_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;
      const { user, token } = await createTestUser({ email: testEmail });
      authToken = token;
      userId = user.user_id;

      // Create a test business
      const business = await prisma.business.create({
        data: {
          name: 'Test Business',
          user_id: userId
        }
      });
      businessId = business.business_id;
    });

    it('should add favorite with authentication', async () => {
      const response = await request(app)
        .post('/api/user/favorite')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ business_id: businessId });

      expect(response.status).toBe(201);
      expect(response.body.message).toContain('added to favorites');
    });

    it('should reject adding duplicate favorite', async () => {
      // Add first time
      await request(app)
        .post('/api/user/favorite')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ business_id: businessId });

      // Try to add again
      const response = await request(app)
        .post('/api/user/favorite')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ business_id: businessId });

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('Already in favorites');
    });

    it('should remove favorite', async () => {
      // Add favorite first
      await request(app)
        .post('/api/user/favorite')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ business_id: businessId });

      // Remove it
      const response = await request(app)
        .delete('/api/user/favorite')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ business_id: businessId });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('removed from favorites');
    });

    it('should reject favorite without authentication', async () => {
      const response = await request(app)
        .post('/api/user/favorite')
        .send({ business_id: businessId });

      expect(response.status).toBe(401);
    });
  });
});
