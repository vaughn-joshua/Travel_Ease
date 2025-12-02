/**
 * Validation Tests
 */

import { describe, it, expect } from 'vitest';
import {
  registerSchema,
  loginSchema,
  createPlanSchema,
  createActivitySchema,
  createBusinessSchema,
  createReviewSchema
} from '../src/schemas/validation.js';

describe('Validation Schemas', () => {
  describe('registerSchema', () => {
    it('should accept valid registration data', () => {
      const validData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        password: 'secure123',
        contact_no: '1234567890'
      };

      expect(() => registerSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid email', () => {
      const invalidData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'not-an-email',
        password: 'secure123'
      };

      expect(() => registerSchema.parse(invalidData)).toThrow();
    });

    it('should reject short password', () => {
      const invalidData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        password: '123'
      };

      expect(() => registerSchema.parse(invalidData)).toThrow();
    });
  });

  describe('createPlanSchema', () => {
    it('should accept valid plan data', () => {
      const validData = {
        title: 'Beach Trip',
        description: 'Summer vacation',
        location: 'Boracay',
        start_date: '2025-07-01',
        end_date: '2025-07-07',
        slots: 5
      };

      expect(() => createPlanSchema.parse(validData)).not.toThrow();
    });

    it('should accept minimal plan data', () => {
      const minimalData = {
        title: 'Quick Trip'
      };

      expect(() => createPlanSchema.parse(minimalData)).not.toThrow();
    });

    it('should reject empty title', () => {
      const invalidData = {
        title: '',
        location: 'Manila'
      };

      expect(() => createPlanSchema.parse(invalidData)).toThrow();
    });
  });

  describe('createActivitySchema', () => {
    it('should accept valid activity data with DB format budget range', () => {
      const validData = {
        travel_plan_id: 1,
        notes: 'Visit beach',
        target_date: '2025-07-02',
        budget_range: '100-200',
        lat: 11.9674,
        lng: 121.9201
      };

      expect(() => createActivitySchema.parse(validData)).not.toThrow();
    });

    it('should accept valid activity data with API format budget range', () => {
      const validData = {
        travel_plan_id: 1,
        notes: 'Visit beach',
        target_date: '2025-07-02',
        budget_range: 'RANGE_100_200',
        lat: 11.9674,
        lng: 121.9201
      };

      expect(() => createActivitySchema.parse(validData)).not.toThrow();
    });

    it('should accept activity with location fields', () => {
      const validData = {
        travel_plan_id: 1,
        notes: 'Visit beach',
        location: 'Boracay Beach',
        name: 'White Beach',
        brgy: 'Balabag',
        city: 'Malay',
        province: 'Aklan'
      };

      expect(() => createActivitySchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid travel_plan_id', () => {
      const invalidData = {
        travel_plan_id: -1,
        notes: 'Invalid plan id'
      };

      expect(() => createActivitySchema.parse(invalidData)).toThrow();
    });
  });

  describe('createBusinessSchema', () => {
    it('should accept valid business data', () => {
      const validData = {
        name: 'Best Restaurant',
        street: 'Main St',
        city: 'Manila',
        category: ['food', 'drinks']
      };

      expect(() => createBusinessSchema.parse(validData)).not.toThrow();
    });

    it('should reject empty category array', () => {
      const invalidData = {
        name: 'Restaurant',
        category: []
      };

      expect(() => createBusinessSchema.parse(invalidData)).toThrow();
    });
  });

  describe('createReviewSchema', () => {
    it('should accept valid business review', () => {
      const validData = {
        business_id: 1,
        rating: 4.5,
        content: 'Great service!'
      };

      expect(() => createReviewSchema.parse(validData)).not.toThrow();
    });

    it('should reject rating out of range', () => {
      const invalidData = {
        business_id: 1,
        rating: 6,  // Max is 5
        content: 'Too high'
      };

      expect(() => createReviewSchema.parse(invalidData)).toThrow();
    });

    it('should reject review without target', () => {
      const invalidData = {
        rating: 4,
        content: 'No target specified'
      };

      expect(() => createReviewSchema.parse(invalidData)).toThrow();
    });
  });
});

