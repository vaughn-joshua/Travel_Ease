/**
 * DTO Mapper Tests
 * 
 * Tests for the frontend DTO normalization and state helpers.
 * See docs/state-machines.md for the canonical rules.
 */

import { describe, it, expect } from 'vitest';
import {
  normalizePlan,
  normalizePlans,
  normalizeActivity,
  normalizeActivities,
  normalizeUpdatePlanPayload,
  isTerminalStatus,
  canJoinPlan,
  isPlanFull,
  getAvailableSlots,
  getAllowedTransitions,
  isValidTransition,
  isAdmin,
  canEditActivities,
  isPending,
  getApprovedParticipants,
  getPendingParticipants,
  PLAN_STATUSES,
  TERMINAL_STATUSES,
  JOINABLE_STATUSES,
} from '../utils/travel_plan/dtoMapper';

describe('Plan Normalization', () => {
  describe('normalizePlan', () => {
    it('should normalize a raw plan with backend naming', () => {
      const raw = {
        travel_plan_id: 123,
        name: 'Beach Trip',
        max_slots: 5,
        visibility: true,
        status: 'Active',
        description: 'Summer vacation',
        location: 'Boracay',
        start_date: '2025-07-01',
        end_date: '2025-07-07',
      };

      const normalized = normalizePlan(raw);

      // Check frontend-preferred names are set
      expect(normalized.id).toBe(123);
      expect(normalized.title).toBe('Beach Trip');
      expect(normalized.slots).toBe(5);
      expect(normalized.is_public).toBe(true);

      // Check backend names are preserved
      expect(normalized.travel_plan_id).toBe(123);
      expect(normalized.name).toBe('Beach Trip');
      expect(normalized.max_slots).toBe(5);
      expect(normalized.visibility).toBe(true);
    });

    it('should handle missing optional fields', () => {
      const raw = {
        travel_plan_id: 1,
        name: 'Simple Plan',
        status: 'Draft',
      };

      const normalized = normalizePlan(raw);

      expect(normalized.id).toBe(1);
      expect(normalized.title).toBe('Simple Plan');
      expect(normalized.slots).toBeNull();
      expect(normalized.is_public).toBe(false);
      expect(normalized.description).toBeNull();
      expect(normalized.location).toBeNull();
    });

    it('should prefer frontend names when both present', () => {
      const raw = {
        id: 1,
        travel_plan_id: 1,
        title: 'Frontend Name',
        name: 'Backend Name',
        slots: 10,
        max_slots: 5,
        is_public: true,
        visibility: false,
        status: 'Draft',
      };

      const normalized = normalizePlan(raw);

      // Should use the values from raw without preference (uses || fallback)
      expect(normalized.id).toBe(1);
      expect(normalized.title).toBe('Frontend Name');
      expect(normalized.slots).toBe(10);
      expect(normalized.is_public).toBe(true);
    });

    it('should include participant count info', () => {
      const raw = {
        travel_plan_id: 1,
        name: 'Plan',
        status: 'Active',
        approvedParticipants: 3,
        slotsAvailable: 2,
        isFull: false,
      };

      const normalized = normalizePlan(raw);

      expect(normalized.approvedParticipants).toBe(3);
      expect(normalized.slotsAvailable).toBe(2);
      expect(normalized.isFull).toBe(false);
    });
  });

  describe('normalizePlans', () => {
    it('should normalize an array of plans', () => {
      const rawPlans = [
        { travel_plan_id: 1, name: 'Plan 1', status: 'Draft' },
        { travel_plan_id: 2, name: 'Plan 2', status: 'Active' },
      ];

      const normalized = normalizePlans(rawPlans);

      expect(normalized).toHaveLength(2);
      expect(normalized[0].id).toBe(1);
      expect(normalized[1].id).toBe(2);
    });

    it('should handle empty array', () => {
      expect(normalizePlans([])).toEqual([]);
    });

    it('should handle non-array input', () => {
      expect(normalizePlans(null as any)).toEqual([]);
      expect(normalizePlans(undefined as any)).toEqual([]);
    });
  });
});

describe('Activity Normalization', () => {
  describe('normalizeActivity', () => {
    it('should normalize a raw activity', () => {
      const raw = {
        activity_id: 1,
        travel_plan_id: 123,
        user_id: 456,
        location: 'Beach Resort',
        name: 'Swimming',
        lat: 10.123,
        lng: 123.456,
        notes: 'Bring sunscreen',
        target_date: '2025-07-02',
        budget_range: '100-200',
        is_priority: true,
      };

      const normalized = normalizeActivity(raw);

      expect(normalized.activity_id).toBe(1);
      expect(normalized.travel_plan_id).toBe(123);
      expect(normalized.location).toBe('Beach Resort');
      expect(normalized.budget_range).toBe('100-200');
      expect(normalized.is_priority).toBe(true);
    });

    it('should handle missing optional fields', () => {
      const raw = {
        activity_id: 1,
        travel_plan_id: 123,
        user_id: 456,
      };

      const normalized = normalizeActivity(raw);

      expect(normalized.location).toBeNull();
      expect(normalized.notes).toBeNull();
      expect(normalized.budget_range).toBeNull();
      expect(normalized.is_priority).toBe(false);
    });

    it('should flatten user info from relation', () => {
      const raw = {
        activity_id: 1,
        travel_plan_id: 123,
        user_id: 456,
        user: {
          first_name: 'John',
          last_name: 'Doe',
        },
      };

      const normalized = normalizeActivity(raw);

      expect(normalized.first_name).toBe('John');
      expect(normalized.last_name).toBe('Doe');
    });
  });

  describe('normalizeActivities', () => {
    it('should normalize an array of activities', () => {
      const rawActivities = [
        { activity_id: 1, travel_plan_id: 123, user_id: 1 },
        { activity_id: 2, travel_plan_id: 123, user_id: 1 },
      ];

      const normalized = normalizeActivities(rawActivities);

      expect(normalized).toHaveLength(2);
      expect(normalized[0].activity_id).toBe(1);
      expect(normalized[1].activity_id).toBe(2);
    });
  });
});

describe('Payload Normalization', () => {
  describe('normalizeUpdatePlanPayload', () => {
    it('should map frontend names to backend names', () => {
      const payload = normalizeUpdatePlanPayload({
        title: 'New Title',
        slots: 10,
        is_public: true,
        status: 'Active',
      });

      expect(payload.name).toBe('New Title');
      expect(payload.max_slots).toBe(10);
      expect(payload.visibility).toBe(true);
      expect(payload.status).toBe('Active');
    });

    it('should only include defined fields', () => {
      const payload = normalizeUpdatePlanPayload({
        title: 'New Title',
      });

      expect(payload.name).toBe('New Title');
      expect(payload).not.toHaveProperty('max_slots');
      expect(payload).not.toHaveProperty('visibility');
      expect(payload).not.toHaveProperty('status');
    });
  });
});

describe('Status Helpers', () => {
  describe('isTerminalStatus', () => {
    it('should identify Completed as terminal', () => {
      expect(isTerminalStatus('Completed')).toBe(true);
    });

    it('should identify Cancelled as terminal', () => {
      expect(isTerminalStatus('Cancelled')).toBe(true);
    });

    it('should not identify Draft as terminal', () => {
      expect(isTerminalStatus('Draft')).toBe(false);
    });

    it('should not identify Active as terminal', () => {
      expect(isTerminalStatus('Active')).toBe(false);
    });
  });

  describe('getAllowedTransitions', () => {
    it('should return correct transitions for Draft', () => {
      expect(getAllowedTransitions('Draft')).toEqual(['Active', 'Cancelled']);
    });

    it('should return correct transitions for Active', () => {
      expect(getAllowedTransitions('Active')).toEqual(['Completed', 'Cancelled']);
    });

    it('should return empty for terminal states', () => {
      expect(getAllowedTransitions('Completed')).toEqual([]);
      expect(getAllowedTransitions('Cancelled')).toEqual([]);
    });
  });

  describe('isValidTransition', () => {
    it('should validate allowed transitions', () => {
      expect(isValidTransition('Draft', 'Active')).toBe(true);
      expect(isValidTransition('Active', 'Completed')).toBe(true);
    });

    it('should reject invalid transitions', () => {
      expect(isValidTransition('Completed', 'Draft')).toBe(false);
      expect(isValidTransition('Draft', 'Completed')).toBe(false);
    });

    it('should allow same state', () => {
      expect(isValidTransition('Draft', 'Draft')).toBe(true);
    });
  });
});

describe('Plan Join Helpers', () => {
  describe('canJoinPlan', () => {
    it('should allow joining visible Draft plans with slots', () => {
      const plan = {
        id: 1,
        travel_plan_id: 1,
        title: 'Test',
        name: 'Test',
        status: 'Draft' as const,
        is_public: true,
        visibility: true,
        slots: 5,
        max_slots: 5,
        approvedParticipants: 2,
        description: null,
        location: null,
        start_date: null,
        end_date: null,
      };

      expect(canJoinPlan(plan)).toBe(true);
    });

    it('should reject joining full plans', () => {
      const plan = {
        id: 1,
        travel_plan_id: 1,
        title: 'Test',
        name: 'Test',
        status: 'Active' as const,
        is_public: true,
        visibility: true,
        slots: 5,
        max_slots: 5,
        approvedParticipants: 5,
        description: null,
        location: null,
        start_date: null,
        end_date: null,
      };

      expect(canJoinPlan(plan)).toBe(false);
    });

    it('should reject joining private plans', () => {
      const plan = {
        id: 1,
        travel_plan_id: 1,
        title: 'Test',
        name: 'Test',
        status: 'Draft' as const,
        is_public: false,
        visibility: false,
        slots: null,
        max_slots: null,
        description: null,
        location: null,
        start_date: null,
        end_date: null,
      };

      expect(canJoinPlan(plan)).toBe(false);
    });

    it('should reject joining Completed plans', () => {
      const plan = {
        id: 1,
        travel_plan_id: 1,
        title: 'Test',
        name: 'Test',
        status: 'Completed' as const,
        is_public: true,
        visibility: true,
        slots: null,
        max_slots: null,
        description: null,
        location: null,
        start_date: null,
        end_date: null,
      };

      expect(canJoinPlan(plan)).toBe(false);
    });
  });

  describe('isPlanFull', () => {
    it('should return true when at capacity', () => {
      const plan = {
        id: 1,
        travel_plan_id: 1,
        title: 'Test',
        name: 'Test',
        status: 'Active' as const,
        is_public: true,
        visibility: true,
        slots: 5,
        max_slots: 5,
        approvedParticipants: 5,
        description: null,
        location: null,
        start_date: null,
        end_date: null,
      };

      expect(isPlanFull(plan)).toBe(true);
    });

    it('should return false when slots available', () => {
      const plan = {
        id: 1,
        travel_plan_id: 1,
        title: 'Test',
        name: 'Test',
        status: 'Active' as const,
        is_public: true,
        visibility: true,
        slots: 5,
        max_slots: 5,
        approvedParticipants: 3,
        description: null,
        location: null,
        start_date: null,
        end_date: null,
      };

      expect(isPlanFull(plan)).toBe(false);
    });

    it('should return false when no slot limit', () => {
      const plan = {
        id: 1,
        travel_plan_id: 1,
        title: 'Test',
        name: 'Test',
        status: 'Active' as const,
        is_public: true,
        visibility: true,
        slots: null,
        max_slots: null,
        approvedParticipants: 100,
        description: null,
        location: null,
        start_date: null,
        end_date: null,
      };

      expect(isPlanFull(plan)).toBe(false);
    });
  });

  describe('getAvailableSlots', () => {
    it('should calculate available slots', () => {
      const plan = {
        id: 1,
        travel_plan_id: 1,
        title: 'Test',
        name: 'Test',
        status: 'Active' as const,
        is_public: true,
        visibility: true,
        slots: 5,
        max_slots: 5,
        approvedParticipants: 3,
        description: null,
        location: null,
        start_date: null,
        end_date: null,
      };

      expect(getAvailableSlots(plan)).toBe(2);
    });

    it('should return null for unlimited plans', () => {
      const plan = {
        id: 1,
        travel_plan_id: 1,
        title: 'Test',
        name: 'Test',
        status: 'Active' as const,
        is_public: true,
        visibility: true,
        slots: null,
        max_slots: null,
        description: null,
        location: null,
        start_date: null,
        end_date: null,
      };

      expect(getAvailableSlots(plan)).toBeNull();
    });
  });
});

describe('Participant Helpers', () => {
  const adminApproved = {
    participant_id: 1,
    travel_plan_id: 1,
    user_id: 1,
    role: 'Admin' as const,
    status: true,
  };

  const editorApproved = {
    participant_id: 2,
    travel_plan_id: 1,
    user_id: 2,
    role: 'Editor' as const,
    status: true,
  };

  const viewerPending = {
    participant_id: 3,
    travel_plan_id: 1,
    user_id: 3,
    role: 'Viewer' as const,
    status: false,
  };

  describe('isAdmin', () => {
    it('should return true for approved Admin', () => {
      expect(isAdmin(adminApproved)).toBe(true);
    });

    it('should return false for pending Admin', () => {
      expect(isAdmin({ ...adminApproved, status: false })).toBe(false);
    });

    it('should return false for non-Admin', () => {
      expect(isAdmin(editorApproved)).toBe(false);
    });
  });

  describe('canEditActivities', () => {
    it('should return true for approved Admin', () => {
      expect(canEditActivities(adminApproved)).toBe(true);
    });

    it('should return true for approved Editor', () => {
      expect(canEditActivities(editorApproved)).toBe(true);
    });

    it('should return false for Viewer', () => {
      expect(canEditActivities({ ...viewerPending, status: true })).toBe(false);
    });

    it('should return false for pending participants', () => {
      expect(canEditActivities({ ...editorApproved, status: false })).toBe(false);
    });
  });

  describe('isPending', () => {
    it('should return true for pending participants', () => {
      expect(isPending(viewerPending)).toBe(true);
    });

    it('should return false for approved participants', () => {
      expect(isPending(adminApproved)).toBe(false);
    });
  });

  describe('getApprovedParticipants', () => {
    it('should filter approved participants', () => {
      const participants = [adminApproved, editorApproved, viewerPending];
      const approved = getApprovedParticipants(participants);

      expect(approved).toHaveLength(2);
      expect(approved).toContain(adminApproved);
      expect(approved).toContain(editorApproved);
    });
  });

  describe('getPendingParticipants', () => {
    it('should filter pending participants', () => {
      const participants = [adminApproved, editorApproved, viewerPending];
      const pending = getPendingParticipants(participants);

      expect(pending).toHaveLength(1);
      expect(pending).toContain(viewerPending);
    });
  });
});

describe('Constants', () => {
  it('should export PLAN_STATUSES', () => {
    expect(PLAN_STATUSES).toEqual(['Draft', 'Active', 'Completed', 'Cancelled']);
  });

  it('should export TERMINAL_STATUSES', () => {
    expect(TERMINAL_STATUSES).toEqual(['Completed', 'Cancelled']);
  });

  it('should export JOINABLE_STATUSES', () => {
    expect(JOINABLE_STATUSES).toEqual(['Draft', 'Active']);
  });
});

