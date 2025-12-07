/**
 * Authentication Tests
 * 
 * Tests for:
 * - Validation of auth endpoints
 * - Protected routes and token verification
 * - Profile management and onboarding flow
 * - OAuth sync and profile_completed states
 * 
 * Note: Registration and login use Supabase Auth in production.
 * These tests use local JWT (NODE_ENV=test) for unit testing.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express, { type Express } from 'express';
import { prisma } from '../src/lib/prisma.js';
import userRoutes from '../src/routes/userRoutes.js';
import { createTestUser } from './setup.js';
import { errorHandler } from '../src/middleware/errorHandler.js';

const app: Express = express();
app.use(express.json());
app.use('/api/user', userRoutes);
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
    let authToken: string;
    let userId: number;
    let testEmail: string;

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
    let authToken: string;
    let userId: number;
    let businessId: number;
    let testEmail: string;

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

  describe('Profile Management', () => {
    let authToken: string;
    let userId: number;
    let testEmail: string;

    beforeEach(async () => {
      testEmail = `profile_test_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;
      const { user, token } = await createTestUser({ 
        email: testEmail,
        profile_completed: false, // Start with incomplete profile
      });
      authToken = token;
      userId = user.user_id;
    });

    it('should get current user profile with /me endpoint', async () => {
      const response = await request(app)
        .get('/api/user/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.email).toBe(testEmail);
      expect(response.body).toHaveProperty('auth_provider');
      expect(response.body).toHaveProperty('profile_completed');
    });

    it('should update profile and set profile_completed to true', async () => {
      const response = await request(app)
        .put('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          first_name: 'Updated',
          last_name: 'User',
          contact_no: '+1234567890',
        });

      expect(response.status).toBe(200);
      expect(response.body.user.first_name).toBe('Updated');
      expect(response.body.user.last_name).toBe('User');
      expect(response.body.user.profile_completed).toBe(true);
    });

    it('should return profile_completed in /me response', async () => {
      // First update profile to complete it
      await request(app)
        .put('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ first_name: 'Test', last_name: 'User' });

      // Then verify /me returns correct state
      const response = await request(app)
        .get('/api/user/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.profile_completed).toBe(true);
    });
  });

  describe('OAuth Sync', () => {
    let authToken: string;
    let userId: number;
    let testEmail: string;

    beforeEach(async () => {
      testEmail = `oauth_test_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;
      const { user, token } = await createTestUser({ 
        email: testEmail,
        auth_provider: 'google',
        profile_completed: false,
      });
      authToken = token;
      userId = user.user_id;
    });

    it('should sync OAuth user and return needsOnboarding for incomplete profile', async () => {
      const response = await request(app)
        .post('/api/user/oauth')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe(testEmail);
      expect(response.body.needsOnboarding).toBe(true);
      expect(response.body.isNewUser).toBe(true);
    });

    it('should return needsOnboarding=false for completed profile', async () => {
      // First complete the profile
      await prisma.user.update({
        where: { user_id: userId },
        data: { profile_completed: true },
      });

      const response = await request(app)
        .post('/api/user/oauth')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.needsOnboarding).toBe(false);
      expect(response.body.isNewUser).toBe(false);
    });

    it('should include auth_provider in OAuth sync response', async () => {
      const response = await request(app)
        .post('/api/user/oauth')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user.auth_provider).toBe('google');
    });
  });

  describe('Auto-Provisioned Users', () => {
    /**
     * Tests for auto-provisioning behavior.
     * 
     * In production, when a user authenticates via Supabase OAuth (Google)
     * but has no local user record, the authenticateToken middleware
     * auto-provisions a minimal user with:
     * - first_name/last_name from Supabase metadata
     * - auth_provider='google'
     * - profile_completed=false (requires onboarding)
     * 
     * In test mode (local JWT), we simulate this by creating users
     * with profile_completed=false and auth_provider='google'.
     */
    
    it('should handle auto-provisioned user with minimal profile data', async () => {
      // Simulate auto-provisioned user (minimal data, no contact info)
      const testEmail = `autoprov_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;
      const { user, token } = await createTestUser({
        email: testEmail,
        first_name: 'Google',
        last_name: 'User',
        auth_provider: 'google',
        profile_completed: false,
        contact_no: undefined, // Auto-provisioned users may not have contact
      });

      // OAuth sync should work and indicate onboarding needed
      const response = await request(app)
        .post('/api/user/oauth')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.needsOnboarding).toBe(true);
      expect(response.body.user.auth_provider).toBe('google');
      expect(response.body.user.profile_completed).toBe(false);
    });

    it('should allow profile completion for auto-provisioned user', async () => {
      // Simulate auto-provisioned user
      const testEmail = `autoprov_complete_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;
      const { user, token } = await createTestUser({
        email: testEmail,
        first_name: 'Google',
        last_name: '',
        auth_provider: 'google',
        profile_completed: false,
      });

      // Complete profile via onboarding
      const updateResponse = await request(app)
        .put('/api/user/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          first_name: 'Updated',
          last_name: 'Name',
          contact_no: '+1234567890',
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.user.profile_completed).toBe(true);

      // Subsequent OAuth sync should show onboarding not needed
      const oauthResponse = await request(app)
        .post('/api/user/oauth')
        .set('Authorization', `Bearer ${token}`);

      expect(oauthResponse.status).toBe(200);
      expect(oauthResponse.body.needsOnboarding).toBe(false);
    });

    it('should preserve Google auth_provider after profile update', async () => {
      const testEmail = `autoprov_preserve_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;
      const { token } = await createTestUser({
        email: testEmail,
        auth_provider: 'google',
        profile_completed: false,
      });

      // Update profile
      await request(app)
        .put('/api/user/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ first_name: 'Test', last_name: 'User' });

      // Verify auth_provider is still google
      const response = await request(app)
        .get('/api/user/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.auth_provider).toBe('google');
    });
  });

  describe('Password Identity (has_email_identity)', () => {
    /**
     * Tests for has_email_identity flag.
     * 
     * has_email_identity indicates whether a user can log in with email+password:
     * - Registered users (auth_provider='password'): always true
     * - Google OAuth users: false until they set a password, then true
     * - Required before disconnecting Google account
     */

    it('should return has_email_identity=true for password users', async () => {
      const testEmail = `password_user_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;
      const { token } = await createTestUser({
        email: testEmail,
        auth_provider: 'password',
        has_email_identity: true,
      });

      const response = await request(app)
        .get('/api/user/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.has_email_identity).toBe(true);
      expect(response.body.auth_provider).toBe('password');
    });

    it('should return has_email_identity=false for new Google OAuth users', async () => {
      const testEmail = `google_new_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;
      const { token } = await createTestUser({
        email: testEmail,
        auth_provider: 'google',
        has_email_identity: false, // New Google users don't have email identity
        profile_completed: false,
      });

      const response = await request(app)
        .get('/api/user/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.has_email_identity).toBe(false);
      expect(response.body.auth_provider).toBe('google');
    });

    it('should include has_email_identity in OAuth sync response', async () => {
      const testEmail = `oauth_identity_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;
      const { token } = await createTestUser({
        email: testEmail,
        auth_provider: 'google',
        has_email_identity: false,
        profile_completed: true,
      });

      const response = await request(app)
        .post('/api/user/oauth')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty('has_email_identity');
      expect(response.body.user.has_email_identity).toBe(false);
    });

    it('should include has_email_identity in profile update response', async () => {
      const testEmail = `profile_identity_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;
      const { token } = await createTestUser({
        email: testEmail,
        auth_provider: 'password',
        has_email_identity: true,
      });

      const response = await request(app)
        .put('/api/user/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ first_name: 'Updated', last_name: 'User' });

      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty('has_email_identity');
      expect(response.body.user.has_email_identity).toBe(true);
    });

    it('should reject set-password for non-Google users', async () => {
      const testEmail = `set_pass_reject_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;
      const { token } = await createTestUser({
        email: testEmail,
        auth_provider: 'password',
        has_email_identity: true,
      });

      const response = await request(app)
        .post('/api/user/set-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ password: 'newpassword123' });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('NOT_GOOGLE_USER');
    });

    it('should reject set-password with short password', async () => {
      const testEmail = `set_pass_short_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;
      const { token } = await createTestUser({
        email: testEmail,
        auth_provider: 'google',
        has_email_identity: false,
      });

      const response = await request(app)
        .post('/api/user/set-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ password: '123' });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('PASSWORD_TOO_SHORT');
    });
  });
});

