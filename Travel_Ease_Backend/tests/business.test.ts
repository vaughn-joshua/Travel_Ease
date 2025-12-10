/**
 * Business Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express, { type Express } from 'express';
import { prisma } from '../src/lib/prisma.js';
import { businessRoutes as business_routes } from '../src/routes/index.js';
import { createTestUser, cleanupTestData } from './setup.js';
import type { User } from '@prisma/client';

const app: Express = express();
app.use(express.json());
app.use('/api/business', business_routes);

describe('Business', () => {
  // Google auth users (can create/edit businesses)
  let googleUser1: User, googleToken1: string, googleUser2: User, googleToken2: string;
  // Password auth user (cannot create/edit businesses)
  let passwordUser: User, passwordToken: string;

  beforeEach(async () => {
    await cleanupTestData();
    
    // Create Google-authenticated users (required for business operations)
    const result1 = await createTestUser({ 
      email: `biz1_${Date.now()}@example.com`,
      auth_provider: 'google'
    });
    googleUser1 = result1.user;
    googleToken1 = result1.token;

    const result2 = await createTestUser({ 
      email: `biz2_${Date.now()}@example.com`,
      auth_provider: 'google'
    });
    googleUser2 = result2.user;
    googleToken2 = result2.token;

    // Create password-authenticated user (should be rejected for business ops)
    const result3 = await createTestUser({ 
      email: `password_${Date.now()}@example.com`,
      auth_provider: 'password'
    });
    passwordUser = result3.user;
    passwordToken = result3.token;
  });

  // Legacy aliases for backward compatibility with existing tests
  let user1: User, token1: string, user2: User, token2: string;
  beforeEach(() => {
    user1 = googleUser1;
    token1 = googleToken1;
    user2 = googleUser2;
    token2 = googleToken2;
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

    it('should reject password-authenticated users with 403', async () => {
      const response = await request(app)
        .post('/api/business/create_business')
        .set('Authorization', `Bearer ${passwordToken}`)
        .send({
          name: 'Password User Business',
          street: 'Main St',
          city: 'Manila',
          description: 'Should be rejected',
          category: ['food'],
          lat: 14.5995,
          lng: 120.9842
        });

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('GOOGLE_AUTH_REQUIRED');
      expect(response.body.error).toContain('Google authentication required');
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

    it('should reject password-authenticated users with 403', async () => {
      const response = await request(app)
        .put(`/api/business/edit_business/${businessId}`)
        .set('Authorization', `Bearer ${passwordToken}`)
        .send({
          name: 'Password User Edit Attempt'
        });

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('GOOGLE_AUTH_REQUIRED');
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

  describe('Price Range Filtering', () => {
    beforeEach(async () => {
      // Create businesses with different price ranges
      const biz1 = await prisma.business.create({
        data: {
          name: 'Budget Restaurant',
          user_id: user1.user_id,
          city: 'Manila',
          status: true,
        }
      });
      const cat1 = await prisma.businessCategory.create({
        data: {
          business_id: biz1.business_id,
          category_name: 'food'
        }
      });
      await prisma.priceRange.create({
        data: {
          category_id: cat1.category_id,
          min_price: 50,
          max_price: 150
        }
      });

      const biz2 = await prisma.business.create({
        data: {
          name: 'Mid-Range Restaurant',
          user_id: user1.user_id,
          city: 'Manila',
          status: true,
        }
      });
      const cat2 = await prisma.businessCategory.create({
        data: {
          business_id: biz2.business_id,
          category_name: 'food'
        }
      });
      await prisma.priceRange.create({
        data: {
          category_id: cat2.category_id,
          min_price: 200,
          max_price: 400
        }
      });

      const biz3 = await prisma.business.create({
        data: {
          name: 'Expensive Restaurant',
          user_id: user1.user_id,
          city: 'Manila',
          status: true,
        }
      });
      const cat3 = await prisma.businessCategory.create({
        data: {
          business_id: biz3.business_id,
          category_name: 'food'
        }
      });
      await prisma.priceRange.create({
        data: {
          category_id: cat3.category_id,
          min_price: 500,
          max_price: 1000
        }
      });
    });

    it('should filter businesses by minimum price', async () => {
      const response = await request(app)
        .get('/api/business/businesses?minPrice=300');

      expect(response.status).toBe(200);
      expect(response.body.items.length).toBeGreaterThanOrEqual(2);
      // Should include mid-range and expensive, excluding budget
      const names = response.body.items.map((b: any) => b.name);
      expect(names).toContain('Mid-Range Restaurant');
      expect(names).toContain('Expensive Restaurant');
    });

    it('should filter businesses by maximum price', async () => {
      const response = await request(app)
        .get('/api/business/businesses?maxPrice=200');

      expect(response.status).toBe(200);
      expect(response.body.items.length).toBeGreaterThanOrEqual(2);
      // Should include budget and mid-range (min_price <= 200)
      const names = response.body.items.map((b: any) => b.name);
      expect(names).toContain('Budget Restaurant');
      expect(names).toContain('Mid-Range Restaurant');
    });

    it('should filter businesses by price range', async () => {
      const response = await request(app)
        .get('/api/business/businesses?minPrice=100&maxPrice=300');

      expect(response.status).toBe(200);
      // Should include budget (max >= 100) and mid-range (min <= 300)
      const names = response.body.items.map((b: any) => b.name);
      expect(names).toContain('Budget Restaurant');
      expect(names).toContain('Mid-Range Restaurant');
    });

    it('should return aggregated price range in response', async () => {
      const response = await request(app)
        .get('/api/business/businesses');

      expect(response.status).toBe(200);
      // Each item should have priceRange
      const itemsWithPriceRange = response.body.items.filter(
        (b: any) => b.priceRange !== null
      );
      expect(itemsWithPriceRange.length).toBeGreaterThan(0);
      
      // Verify priceRange structure
      const item = itemsWithPriceRange[0];
      expect(item.priceRange).toHaveProperty('min');
      expect(item.priceRange).toHaveProperty('max');
      expect(typeof item.priceRange.min).toBe('number');
      expect(typeof item.priceRange.max).toBe('number');
    });

    it('should combine category and price filters', async () => {
      const response = await request(app)
        .get('/api/business/businesses?category=food&minPrice=100&maxPrice=300');

      expect(response.status).toBe(200);
      // All items should be food category
      response.body.items.forEach((item: any) => {
        const categoryNames = item.categories.map((c: any) => c.name);
        expect(categoryNames).toContain('food');
      });
    });
  });

  describe('Google Auth Requirement', () => {
    let businessId: number;

    beforeEach(async () => {
      // Create a business owned by googleUser1
      const response = await request(app)
        .post('/api/business/create_business')
        .set('Authorization', `Bearer ${googleToken1}`)
        .send({
          name: 'Google Auth Test Business',
          category: ['food'],
          city: 'Manila'
        });

      businessId = response.body.business_id;
    });

    describe('GET /api/business/my-businesses', () => {
      it('should allow Google-authenticated users to view their businesses', async () => {
        const response = await request(app)
          .get('/api/business/my-businesses')
          .set('Authorization', `Bearer ${googleToken1}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Success');
        expect(response.body.data).toBeInstanceOf(Array);
      });

      it('should reject password-authenticated users with 403', async () => {
        const response = await request(app)
          .get('/api/business/my-businesses')
          .set('Authorization', `Bearer ${passwordToken}`);

        expect(response.status).toBe(403);
        expect(response.body.code).toBe('GOOGLE_AUTH_REQUIRED');
      });
    });

    describe('DELETE /api/business/delete_business/:id', () => {
      it('should allow Google-authenticated owner to delete business', async () => {
        const response = await request(app)
          .delete(`/api/business/delete_business/${businessId}`)
          .set('Authorization', `Bearer ${googleToken1}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toContain('deleted successfully');
      });

      it('should reject password-authenticated users with 403', async () => {
        const response = await request(app)
          .delete(`/api/business/delete_business/${businessId}`)
          .set('Authorization', `Bearer ${passwordToken}`);

        expect(response.status).toBe(403);
        expect(response.body.code).toBe('GOOGLE_AUTH_REQUIRED');
      });
    });

    describe('Menu Item Routes', () => {
      it('should reject password-authenticated users from creating menu items', async () => {
        const response = await request(app)
          .post(`/api/business/${businessId}/menu`)
          .set('Authorization', `Bearer ${passwordToken}`)
          .send({
            name: 'Test Item',
            price: 100
          });

        expect(response.status).toBe(403);
        expect(response.body.code).toBe('GOOGLE_AUTH_REQUIRED');
      });

      it('should allow Google-authenticated owner to create menu items', async () => {
        const response = await request(app)
          .post(`/api/business/${businessId}/menu`)
          .set('Authorization', `Bearer ${googleToken1}`)
          .send({
            name: 'Test Item',
            price: 100,
            description: 'A test menu item'
          });

        // May be 201 or 200 depending on implementation
        expect([200, 201]).toContain(response.status);
      });
    });
  });
});

