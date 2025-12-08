/**
 * Activity Service Tests
 * 
 * Unit tests for the activity service layer
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '../../src/lib/prisma.js';
import * as activityService from '../../src/services/activityService.js';
import * as travelPlanService from '../../src/services/travelPlanService.js';
import { createTestUser } from '../setup.js';
import type { User } from '@prisma/client';

describe('ActivityService', () => {
  let testUser: User;
  let testPlanId: number;
  let testActivityId: number;

  beforeEach(async () => {
    // Create test user
    testUser = await createTestUser();
    
    // Create test plan
    const plan = await travelPlanService.createPlan(testUser.user_id, {
      title: 'Test Plan for Activities',
    });
    testPlanId = plan.travel_plan_id;
  });

  afterEach(async () => {
    // Clean up test data
    if (testActivityId) {
      await prisma.activity.deleteMany({ 
        where: { activity_id: testActivityId } 
      }).catch(() => {});
    }
    if (testPlanId) {
      await prisma.travel_plan.deleteMany({ 
        where: { travel_plan_id: testPlanId } 
      }).catch(() => {});
    }
    if (testUser?.user_id) {
      await prisma.user.deleteMany({ 
        where: { user_id: testUser.user_id } 
      }).catch(() => {});
    }
  });

  describe('createActivity', () => {
    it('should create an activity with required fields', async () => {
      const input = {
        travel_plan_id: testPlanId,
        notes: 'Visit the museum',
      };

      const result = await activityService.createActivity(testUser.user_id, input);
      testActivityId = result.activity_id;

      expect(result).toBeDefined();
      expect(result.id).toBe(result.activity_id);
      expect(result.travel_plan_id).toBe(testPlanId);
      expect(result.notes).toBe('Visit the museum');
      expect(result.user_id).toBe(testUser.user_id);
    });

    it('should create an activity with location fields', async () => {
      const input = {
        travel_plan_id: testPlanId,
        name: 'Eiffel Tower',
        location: '5 Avenue Anatole France',
        city: 'Paris',
        lat: 48.8584,
        lng: 2.2945,
      };

      const result = await activityService.createActivity(testUser.user_id, input);
      testActivityId = result.activity_id;

      expect(result.name).toBe('Eiffel Tower');
      expect(result.location).toBe('5 Avenue Anatole France');
      expect(result.city).toBe('Paris');
      expect(result.lat).toBeCloseTo(48.8584, 2);
      expect(result.lng).toBeCloseTo(2.2945, 2);
    });

    it('should create an activity with budget range', async () => {
      const input = {
        travel_plan_id: testPlanId,
        budget_range: '100-200',
      };

      const result = await activityService.createActivity(testUser.user_id, input);
      testActivityId = result.activity_id;

      expect(result.budget_range).toBe('100-200');
    });

    it('should normalize budget range from API format', async () => {
      const input = {
        travel_plan_id: testPlanId,
        budget_range: 'RANGE_200_400',
      };

      const result = await activityService.createActivity(testUser.user_id, input);
      testActivityId = result.activity_id;

      expect(result.budget_range).toBe('200-400');
    });

    it('should create an activity with target date', async () => {
      const input = {
        travel_plan_id: testPlanId,
        target_date: '2025-07-01',
      };

      const result = await activityService.createActivity(testUser.user_id, input);
      testActivityId = result.activity_id;

      expect(result.target_date).toBeInstanceOf(Date);
    });
  });

  describe('getActivityById', () => {
    it('should return null for non-existent activity', async () => {
      const result = await activityService.getActivityById(999999);
      expect(result).toBeNull();
    });

    it('should return activity with all fields', async () => {
      // Create activity first
      const created = await activityService.createActivity(testUser.user_id, {
        travel_plan_id: testPlanId,
        notes: 'Test activity',
        name: 'Test Location',
      });
      testActivityId = created.activity_id;

      const result = await activityService.getActivityById(testActivityId);

      expect(result).toBeDefined();
      expect(result!.id).toBe(testActivityId);
      expect(result!.notes).toBe('Test activity');
      expect(result!.name).toBe('Test Location');
    });
  });

  describe('getActivitiesByPlan', () => {
    it('should return empty array for plan with no activities', async () => {
      const result = await activityService.getActivitiesByPlan(testPlanId);
      expect(result).toEqual([]);
    });

    it('should return all activities for a plan', async () => {
      // Create multiple activities
      const activity1 = await activityService.createActivity(testUser.user_id, {
        travel_plan_id: testPlanId,
        notes: 'Activity 1',
      });
      const activity2 = await activityService.createActivity(testUser.user_id, {
        travel_plan_id: testPlanId,
        notes: 'Activity 2',
      });

      const result = await activityService.getActivitiesByPlan(testPlanId);

      expect(result.length).toBe(2);
      expect(result.map(a => a.notes)).toContain('Activity 1');
      expect(result.map(a => a.notes)).toContain('Activity 2');

      // Cleanup
      await prisma.activity.deleteMany({
        where: { activity_id: { in: [activity1.activity_id, activity2.activity_id] } }
      });
    });
  });

  describe('updateActivity', () => {
    it('should update activity notes', async () => {
      const created = await activityService.createActivity(testUser.user_id, {
        travel_plan_id: testPlanId,
        notes: 'Original notes',
      });
      testActivityId = created.activity_id;

      const updated = await activityService.updateActivity(testActivityId, {
        notes: 'Updated notes',
      });

      expect(updated.notes).toBe('Updated notes');
    });

    it('should update is_priority flag', async () => {
      const created = await activityService.createActivity(testUser.user_id, {
        travel_plan_id: testPlanId,
        notes: 'Important activity',
      });
      testActivityId = created.activity_id;

      expect(created.is_priority).toBe(false);

      const updated = await activityService.updateActivity(testActivityId, {
        is_priority: true,
      });

      expect(updated.is_priority).toBe(true);
    });

    it('should update location fields', async () => {
      const created = await activityService.createActivity(testUser.user_id, {
        travel_plan_id: testPlanId,
        city: 'Paris',
      });
      testActivityId = created.activity_id;

      const updated = await activityService.updateActivity(testActivityId, {
        city: 'London',
        location: '221B Baker Street',
      });

      expect(updated.city).toBe('London');
      expect(updated.location).toBe('221B Baker Street');
    });
  });

  describe('deleteActivity', () => {
    it('should delete an activity', async () => {
      const created = await activityService.createActivity(testUser.user_id, {
        travel_plan_id: testPlanId,
        notes: 'Activity to delete',
      });
      const activityId = created.activity_id;

      await activityService.deleteActivity(activityId);

      const result = await activityService.getActivityById(activityId);
      expect(result).toBeNull();
      
      // Reset testActivityId since we deleted it
      testActivityId = 0;
    });
  });

  describe('normalizeBudgetRange', () => {
    it('should normalize API format to DB format', () => {
      expect(activityService.normalizeBudgetRange('RANGE_0_100')).toBe('0-100');
      expect(activityService.normalizeBudgetRange('RANGE_100_200')).toBe('100-200');
      expect(activityService.normalizeBudgetRange('RANGE_1500_PLUS')).toBe('1500+');
    });

    it('should pass through already normalized values', () => {
      expect(activityService.normalizeBudgetRange('0-100')).toBe('0-100');
      expect(activityService.normalizeBudgetRange('1500+')).toBe('1500+');
    });

    it('should return null for invalid values', () => {
      expect(activityService.normalizeBudgetRange(null)).toBeNull();
      expect(activityService.normalizeBudgetRange(undefined)).toBeNull();
      expect(activityService.normalizeBudgetRange('invalid')).toBeNull();
    });
  });

  describe('formatActivityToDTO', () => {
    it('should format activity with normalized fields', () => {
      const activity = {
        activity_id: 1,
        travel_plan_id: 10,
        business_id: null,
        user_id: 5,
        notes: 'Test notes',
        target_date: new Date('2025-07-01'),
        budget_range: '100-200',
        is_priority: true,
        lat: 48.8584,
        lng: 2.2945,
        name: 'Test Location',
        location: 'Test Address',
        brgy: null,
        province: null,
        city: 'Paris',
      };

      const dto = activityService.formatActivityToDTO(activity);

      expect(dto.id).toBe(1);
      expect(dto.activity_id).toBe(1);
      expect(dto.travel_plan_id).toBe(10);
      expect(dto.notes).toBe('Test notes');
      expect(dto.is_priority).toBe(true);
      expect(dto.lat).toBeCloseTo(48.8584, 2);
      expect(dto.lng).toBeCloseTo(2.2945, 2);
      expect(dto.city).toBe('Paris');
    });

    it('should include business info when present', () => {
      const activity = {
        activity_id: 1,
        travel_plan_id: 10,
        business_id: 100,
        user_id: 5,
        notes: null,
        target_date: null,
        budget_range: null,
        is_priority: false,
        lat: null,
        lng: null,
        name: null,
        location: null,
        brgy: null,
        province: null,
        city: null,
        business: {
          business_id: 100,
          name: 'Test Business',
          description: 'A test business',
          latitude: 48.8584,
          longitude: 2.2945,
          city: 'Paris',
          rating: '4.5',
        },
      };

      const dto = activityService.formatActivityToDTO(activity);

      expect(dto.business).toBeDefined();
      expect(dto.business!.business_id).toBe(100);
      expect(dto.business!.name).toBe('Test Business');
      expect(dto.business!.rating).toBeCloseTo(4.5, 1);
    });
  });
});

