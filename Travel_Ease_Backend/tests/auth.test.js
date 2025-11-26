/**
 * Authentication Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { prisma } from '../src/lib/prisma.js';
import user_routes from '../routes/user_routes.js';
import { cleanupTestData } from './setup.js';

const app = express();
app.use(express.json());
app.use('/api/user', user_routes);

describe('Authentication', () => {
  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = 'SecurePass123';

  beforeEach(async () => {
    // Clean up test users
    await prisma.user.deleteMany({
      where: { email: testEmail }
    });
  });

  describe('POST /api/user/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/user/register')
        .send({
          first_name: 'John',
          last_name: 'Doe',
          email: testEmail,
          password: testPassword,
          contact_no: '1234567890'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(testEmail);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should reject registration with existing email', async () => {
      // Create user first
      await request(app)
        .post('/api/user/register')
        .send({
          first_name: 'John',
          last_name: 'Doe',
          email: testEmail,
          password: testPassword
        });

      // Try to register again with same email
      const response = await request(app)
        .post('/api/user/register')
        .send({
          first_name: 'Jane',
          last_name: 'Smith',
          email: testEmail,
          password: 'different123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/user/register')
        .send({
          first_name: 'John',
          last_name: 'Doe',
          email: 'invalid-email',
          password: testPassword
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
          email: testEmail,
          password: '123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('POST /api/user/login', () => {
    beforeEach(async () => {
      // Register a user for login tests
      await request(app)
        .post('/api/user/register')
        .send({
          first_name: 'John',
          last_name: 'Doe',
          email: testEmail,
          password: testPassword
        });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/user/login')
        .send({
          email: testEmail,
          password: testPassword
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testEmail);
    });

    it('should reject login with wrong password', async () => {
      const response = await request(app)
        .post('/api/user/login')
        .send({
          email: testEmail,
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should reject login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/user/login')
        .send({
          email: 'nonexistent@example.com',
          password: testPassword
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });
  });

  describe('Protected Routes', () => {
    let authToken;
    let userId;

    beforeEach(async () => {
      // Register and login
      const regResponse = await request(app)
        .post('/api/user/register')
        .send({
          first_name: 'Test',
          last_name: 'User',
          email: testEmail,
          password: testPassword
        });

      authToken = regResponse.body.token;
      userId = regResponse.body.user.user_id;
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
});
