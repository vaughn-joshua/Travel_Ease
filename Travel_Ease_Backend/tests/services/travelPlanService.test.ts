/**
 * Travel Plan Service Tests
 * 
 * Unit tests for the travel plan service layer
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { prisma } from '../../src/lib/prisma.js';
import * as travelPlanService from '../../src/services/travelPlanService.js';
import { createTestUser, cleanupTestData } from '../setup.js';
import type { User } from '@prisma/client';

describe('TravelPlanService', () => {
  let testUser: User;
  let testPlanId: number;

  beforeEach(async () => {
    // Create test user
    testUser = await createTestUser();
  });

  afterEach(async () => {
    // Clean up test data
    if (testPlanId) {
      await prisma.travelPlan.deleteMany({ 
        where: { travel_plan_id: testPlanId } 
      }).catch(() => {});
    }
    if (testUser?.user_id) {
      await prisma.user.deleteMany({ 
        where: { user_id: testUser.user_id } 
      }).catch(() => {});
    }
  });

  describe('createPlan', () => {
    it('should create a new travel plan with required fields', async () => {
      const input = {
        title: 'Test Trip to Paris',
        description: 'A lovely vacation',
        location: 'Paris, France',
      };

      const result = await travelPlanService.createPlan(testUser.user_id, input);
      testPlanId = result.travel_plan_id;

      expect(result).toBeDefined();
      expect(result.id).toBe(result.travel_plan_id);
      expect(result.title).toBe('Test Trip to Paris');
      expect(result.name).toBe('Test Trip to Paris');
      expect(result.description).toBe('A lovely vacation');
      expect(result.location).toBe('Paris, France');
      expect(result.status).toBe('Draft');
      expect(result.visibility).toBe(false);
    });

    it('should create a plan with dates', async () => {
      const input = {
        title: 'Summer Vacation',
        start_date: '2025-07-01',
        end_date: '2025-07-15',
      };

      const result = await travelPlanService.createPlan(testUser.user_id, input);
      testPlanId = result.travel_plan_id;

      expect(result.start_date).toBeInstanceOf(Date);
      expect(result.end_date).toBeInstanceOf(Date);
    });

    it('should create a plan with max_slots', async () => {
      const input = {
        title: 'Group Trip',
        max_slots: 5,
      };

      const result = await travelPlanService.createPlan(testUser.user_id, input);
      testPlanId = result.travel_plan_id;

      expect(result.max_slots).toBe(5);
      expect(result.slots).toBe(5);
    });
  });

  describe('getPlanById', () => {
    it('should return null for non-existent plan', async () => {
      const result = await travelPlanService.getPlanById(999999);
      expect(result).toBeNull();
    });

    it('should return plan with full details', async () => {
      // Create a plan first
      const created = await travelPlanService.createPlan(testUser.user_id, {
        title: 'Detailed Plan',
        description: 'Plan with details',
      });
      testPlanId = created.travel_plan_id;

      const result = await travelPlanService.getPlanById(testPlanId);

      expect(result).toBeDefined();
      expect(result!.id).toBe(testPlanId);
      expect(result!.title).toBe('Detailed Plan');
    });
  });

  describe('updatePlan', () => {
    it('should update plan name/title', async () => {
      // Create a plan first
      const created = await travelPlanService.createPlan(testUser.user_id, {
        title: 'Original Name',
      });
      testPlanId = created.travel_plan_id;

      const updated = await travelPlanService.updatePlan(testPlanId, {
        name: 'Updated Name',
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.title).toBe('Updated Name');
    });

    it('should update plan status', async () => {
      const created = await travelPlanService.createPlan(testUser.user_id, {
        title: 'Status Test Plan',
      });
      testPlanId = created.travel_plan_id;

      const updated = await travelPlanService.updatePlan(testPlanId, {
        status: 'Active',
      });

      expect(updated.status).toBe('Active');
    });

    it('should update visibility', async () => {
      const created = await travelPlanService.createPlan(testUser.user_id, {
        title: 'Visibility Test',
      });
      testPlanId = created.travel_plan_id;

      const updated = await travelPlanService.updatePlan(testPlanId, {
        visibility: true,
      });

      expect(updated.visibility).toBe(true);
      expect(updated.is_public).toBe(true);
    });
  });

  describe('getUpcomingPlans', () => {
    it('should return empty array when user has no plans', async () => {
      const result = await travelPlanService.getUpcomingPlans(
        testUser.user_id,
        { page: 1, pageSize: 10, skip: 0, take: 10, limit: 10, offset: 0 }
      );

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should return draft plans', async () => {
      // Create a draft plan
      const created = await travelPlanService.createPlan(testUser.user_id, {
        title: 'Draft Plan',
      });
      testPlanId = created.travel_plan_id;

      const result = await travelPlanService.getUpcomingPlans(
        testUser.user_id,
        { page: 1, pageSize: 10, skip: 0, take: 10, limit: 10, offset: 0 }
      );

      expect(result.data.length).toBeGreaterThanOrEqual(1);
      expect(result.data.some(p => p.travel_plan_id === testPlanId)).toBe(true);
    });
  });

  describe('userHasPlanAccess', () => {
    it('should return true for plan owner', async () => {
      const created = await travelPlanService.createPlan(testUser.user_id, {
        title: 'Access Test Plan',
      });
      testPlanId = created.travel_plan_id;

      const hasAccess = await travelPlanService.userHasPlanAccess(
        testUser.user_id,
        testPlanId
      );

      expect(hasAccess).toBe(true);
    });

    it('should return false for non-owner non-participant', async () => {
      const created = await travelPlanService.createPlan(testUser.user_id, {
        title: 'Private Plan',
      });
      testPlanId = created.travel_plan_id;

      // Create another user
      const otherUser = await createTestUser();
      
      const hasAccess = await travelPlanService.userHasPlanAccess(
        otherUser.user_id,
        testPlanId
      );

      expect(hasAccess).toBe(false);

      // Cleanup
      await prisma.user.deleteMany({ where: { user_id: otherUser.user_id } });
    });
  });

  describe('userIsPlanOwner', () => {
    it('should return true for plan owner', async () => {
      const created = await travelPlanService.createPlan(testUser.user_id, {
        title: 'Owner Test Plan',
      });
      testPlanId = created.travel_plan_id;

      const isOwner = await travelPlanService.userIsPlanOwner(
        testUser.user_id,
        testPlanId
      );

      expect(isOwner).toBe(true);
    });

    it('should return false for non-owner', async () => {
      const created = await travelPlanService.createPlan(testUser.user_id, {
        title: 'Not My Plan',
      });
      testPlanId = created.travel_plan_id;

      const otherUser = await createTestUser();
      
      const isOwner = await travelPlanService.userIsPlanOwner(
        otherUser.user_id,
        testPlanId
      );

      expect(isOwner).toBe(false);

      // Cleanup
      await prisma.user.deleteMany({ where: { user_id: otherUser.user_id } });
    });
  });

  describe('deletePlan', () => {
    it('should delete a plan', async () => {
      const created = await travelPlanService.createPlan(testUser.user_id, {
        title: 'Plan to Delete',
      });
      const planId = created.travel_plan_id;

      await travelPlanService.deletePlan(planId);

      const result = await travelPlanService.getPlanById(planId);
      expect(result).toBeNull();
      
      // Reset testPlanId since we deleted it
      testPlanId = 0;
    });
  });

  describe('formatPlanToDTO', () => {
    it('should format plan with normalized fields', () => {
      const plan = {
        travel_plan_id: 1,
        name: 'Test Plan',
        description: 'A test',
        location: 'Test City',
        start_date: new Date('2025-01-01'),
        end_date: new Date('2025-01-05'),
        status: 'Draft',
        max_slots: 10,
        visibility: true,
        user_id: 1,
      };

      const dto = travelPlanService.formatPlanToDTO(plan);

      expect(dto.id).toBe(1);
      expect(dto.travel_plan_id).toBe(1);
      expect(dto.title).toBe('Test Plan');
      expect(dto.name).toBe('Test Plan');
      expect(dto.slots).toBe(10);
      expect(dto.max_slots).toBe(10);
      expect(dto.is_public).toBe(true);
      expect(dto.visibility).toBe(true);
    });

    it('should merge extras into DTO', () => {
      const plan = {
        travel_plan_id: 1,
        name: 'Test Plan',
        description: null,
        location: null,
        start_date: null,
        end_date: null,
        status: 'Draft',
        max_slots: null,
        visibility: false,
        user_id: 1,
      };

      const dto = travelPlanService.formatPlanToDTO(plan, {
        approvedParticipants: 5,
        customField: 'value',
      });

      expect((dto as any).approvedParticipants).toBe(5);
      expect((dto as any).customField).toBe('value');
    });
  });
});

