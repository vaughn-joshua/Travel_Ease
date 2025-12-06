/**
 * Business Service Tests
 * 
 * Tests for the price range aggregation and DTO formatting functions.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../../src/lib/prisma.js';
import { cleanupTestData, createTestUser } from '../setup.js';
import {
  computePriceRangesForBusinesses,
  computePriceRangeForBusiness,
  formatBusinessToDTO,
  formatBusinessListItemDetailed,
} from '../../src/services/businessService.js';
import type { User } from '@prisma/client';

describe('Business Service', () => {
  let testUser: User;

  beforeEach(async () => {
    await cleanupTestData();
    const result = await createTestUser({ email: `bizservice_${Date.now()}@example.com` });
    testUser = result.user;
  });

  describe('computePriceRangesForBusinesses', () => {
    it('should return empty map for empty business IDs array', async () => {
      const result = await computePriceRangesForBusinesses([]);
      expect(result.size).toBe(0);
    });

    it('should aggregate min/max price across categories for single business', async () => {
      // Create business with multiple categories and price ranges
      const business = await prisma.business.create({
        data: {
          name: 'Multi-Category Business',
          user_id: testUser.user_id,
        }
      });

      // Category 1: Food with price range 100-200
      const cat1 = await prisma.businessCategory.create({
        data: {
          business_id: business.business_id,
          category_name: 'food'
        }
      });
      await prisma.priceRange.create({
        data: {
          category_id: cat1.category_id,
          min_price: 100,
          max_price: 200
        }
      });

      // Category 2: Drinks with price range 50-150
      const cat2 = await prisma.businessCategory.create({
        data: {
          business_id: business.business_id,
          category_name: 'drinks'
        }
      });
      await prisma.priceRange.create({
        data: {
          category_id: cat2.category_id,
          min_price: 50,
          max_price: 150
        }
      });

      const result = await computePriceRangesForBusinesses([business.business_id]);

      expect(result.get(business.business_id)).toEqual({
        min: 50,   // min across all categories
        max: 200,  // max across all categories
      });
    });

    it('should compute price ranges for multiple businesses in single query', async () => {
      // Create two businesses
      const biz1 = await prisma.business.create({
        data: { name: 'Business 1', user_id: testUser.user_id }
      });
      const cat1 = await prisma.businessCategory.create({
        data: { business_id: biz1.business_id, category_name: 'food' }
      });
      await prisma.priceRange.create({
        data: { category_id: cat1.category_id, min_price: 100, max_price: 300 }
      });

      const biz2 = await prisma.business.create({
        data: { name: 'Business 2', user_id: testUser.user_id }
      });
      const cat2 = await prisma.businessCategory.create({
        data: { business_id: biz2.business_id, category_name: 'drinks' }
      });
      await prisma.priceRange.create({
        data: { category_id: cat2.category_id, min_price: 50, max_price: 150 }
      });

      const result = await computePriceRangesForBusinesses([biz1.business_id, biz2.business_id]);

      expect(result.size).toBe(2);
      expect(result.get(biz1.business_id)).toEqual({ min: 100, max: 300 });
      expect(result.get(biz2.business_id)).toEqual({ min: 50, max: 150 });
    });

    it('should return null for business without price ranges', async () => {
      const business = await prisma.business.create({
        data: { name: 'No Price Business', user_id: testUser.user_id }
      });
      await prisma.businessCategory.create({
        data: { business_id: business.business_id, category_name: 'food' }
      });
      // No price range added

      const result = await computePriceRangesForBusinesses([business.business_id]);

      expect(result.get(business.business_id)).toBeNull();
    });
  });

  describe('computePriceRangeForBusiness', () => {
    it('should return price range for single business', async () => {
      const business = await prisma.business.create({
        data: { name: 'Single Business', user_id: testUser.user_id }
      });
      const cat = await prisma.businessCategory.create({
        data: { business_id: business.business_id, category_name: 'food' }
      });
      await prisma.priceRange.create({
        data: { category_id: cat.category_id, min_price: 200, max_price: 400 }
      });

      const result = await computePriceRangeForBusiness(business.business_id);

      expect(result).toEqual({ min: 200, max: 400 });
    });
  });

  describe('formatBusinessListItemDetailed', () => {
    it('should use pre-computed price range when provided', () => {
      const mockBusiness = {
        business_id: 1,
        name: 'Test Business',
        description: 'Test description',
        categories: [{ category_id: 1, category_name: 'food' }],
        business_hours: [],
        picture: null,
        latitude: 14.5,
        longitude: 120.9,
        house_number: '123',
        street: 'Main St',
        brgy: 'Barangay 1',
        city: 'Manila',
        rating: '4.5',
        status: true,
        user: { user_id: 1, first_name: 'John', last_name: 'Doe' }
      };

      const precomputedPriceRange = { min: 100, max: 500 };
      const result = formatBusinessListItemDetailed(mockBusiness, precomputedPriceRange);

      expect(result.priceRange).toEqual({ min: 100, max: 500 });
    });

    it('should compute price range from relations when not pre-computed', () => {
      const mockBusiness = {
        business_id: 1,
        name: 'Test Business',
        description: null,
        categories: [
          {
            category_id: 1,
            category_name: 'food',
            price_ranges: [
              { min_price: 50, max_price: 150 }
            ]
          },
          {
            category_id: 2,
            category_name: 'drinks',
            price_ranges: [
              { min_price: 30, max_price: 100 }
            ]
          }
        ],
        business_hours: [],
        picture: null,
        latitude: null,
        longitude: null,
        house_number: null,
        street: null,
        brgy: null,
        city: null,
        rating: null,
        status: null,
        user: null
      };

      const result = formatBusinessListItemDetailed(mockBusiness);

      expect(result.priceRange).toEqual({ min: 30, max: 150 });
    });
  });

  describe('formatBusinessToDTO', () => {
    it('should use pre-computed price range when provided', () => {
      const mockBusiness = {
        business_id: 1,
        name: 'Test Business',
        description: 'Description',
        categories: [{ category_id: 1, category_name: 'food' }],
        business_hours: [],
        menu_items: [],
        reviews: [],
        picture: null,
        latitude: 14.5,
        longitude: 120.9,
        house_number: '123',
        street: 'Main St',
        brgy: 'Barangay 1',
        city: 'Manila',
        rating: '4.5',
        status: true,
        user: { user_id: 1, first_name: 'John', last_name: 'Doe', email: 'john@test.com' }
      };

      const precomputedPriceRange = { min: 200, max: 800 };
      const result = formatBusinessToDTO(mockBusiness, precomputedPriceRange);

      expect(result.priceRange).toEqual({ min: 200, max: 800 });
      expect(result.id).toBe(1);
      expect(result.name).toBe('Test Business');
    });
  });
});

