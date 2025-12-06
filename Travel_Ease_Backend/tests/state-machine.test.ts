/**
 * State Machine Tests
 * 
 * Tests for the centralized state machine logic in utils/stateMachine.ts
 * See docs/state-machines.md for the canonical rules.
 */

import { describe, it, expect } from 'vitest';
import {
  isValidTransition,
  validateStatusTransition,
  canAcceptParticipants,
  isTerminalState,
  validateVisibilityChange,
  canApproveParticipant,
  validateMaxSlotsChange,
  validateDateRange,
  validateRoleDemotion,
  validateParticipantRemoval,
  getRolePermissions,
  hasPermission,
  PlanStateMachine,
} from '../src/modules/travel-plan/utils/stateMachine.js';

describe('TravelPlan Status State Machine', () => {
  describe('isValidTransition', () => {
    it('should allow Draft → Active', () => {
      expect(isValidTransition('Draft', 'Active')).toBe(true);
    });

    it('should allow Draft → Cancelled', () => {
      expect(isValidTransition('Draft', 'Cancelled')).toBe(true);
    });

    it('should allow Active → Completed', () => {
      expect(isValidTransition('Active', 'Completed')).toBe(true);
    });

    it('should allow Active → Cancelled', () => {
      expect(isValidTransition('Active', 'Cancelled')).toBe(true);
    });

    it('should allow same state (no-op)', () => {
      expect(isValidTransition('Draft', 'Draft')).toBe(true);
      expect(isValidTransition('Active', 'Active')).toBe(true);
      expect(isValidTransition('Completed', 'Completed')).toBe(true);
    });

    it('should reject Completed → any state (terminal)', () => {
      expect(isValidTransition('Completed', 'Draft')).toBe(false);
      expect(isValidTransition('Completed', 'Active')).toBe(false);
      expect(isValidTransition('Completed', 'Cancelled')).toBe(false);
    });

    it('should reject Cancelled → any state (terminal)', () => {
      expect(isValidTransition('Cancelled', 'Draft')).toBe(false);
      expect(isValidTransition('Cancelled', 'Active')).toBe(false);
      expect(isValidTransition('Cancelled', 'Completed')).toBe(false);
    });

    it('should reject Draft → Completed (must go through Active)', () => {
      expect(isValidTransition('Draft', 'Completed')).toBe(false);
    });

    it('should reject Active → Draft (no reversal)', () => {
      expect(isValidTransition('Active', 'Draft')).toBe(false);
    });
  });

  describe('validateStatusTransition', () => {
    it('should return side effects for terminal transitions', () => {
      const result = validateStatusTransition('Active', 'Completed');
      expect(result.allowed).toBe(true);
      expect(result.sideEffects?.visibility).toBe(false);
    });

    it('should not have side effects for non-terminal transitions', () => {
      const result = validateStatusTransition('Draft', 'Active');
      expect(result.allowed).toBe(true);
      expect(result.sideEffects?.visibility).toBeUndefined();
    });

    it('should provide error message for invalid transitions', () => {
      const result = validateStatusTransition('Completed', 'Draft');
      expect(result.allowed).toBe(false);
      expect(result.error).toContain('Cannot transition');
    });
  });

  describe('isTerminalState', () => {
    it('should identify Completed as terminal', () => {
      expect(isTerminalState('Completed')).toBe(true);
    });

    it('should identify Cancelled as terminal', () => {
      expect(isTerminalState('Cancelled')).toBe(true);
    });

    it('should not identify Draft as terminal', () => {
      expect(isTerminalState('Draft')).toBe(false);
    });

    it('should not identify Active as terminal', () => {
      expect(isTerminalState('Active')).toBe(false);
    });
  });
});

describe('Visibility Rules', () => {
  describe('canAcceptParticipants', () => {
    it('should allow joining Draft + visible plans', () => {
      expect(canAcceptParticipants('Draft', true)).toBe(true);
    });

    it('should allow joining Active + visible plans', () => {
      expect(canAcceptParticipants('Active', true)).toBe(true);
    });

    it('should reject joining invisible plans', () => {
      expect(canAcceptParticipants('Draft', false)).toBe(false);
      expect(canAcceptParticipants('Active', false)).toBe(false);
    });

    it('should reject joining terminal plans', () => {
      expect(canAcceptParticipants('Completed', true)).toBe(false);
      expect(canAcceptParticipants('Cancelled', true)).toBe(false);
    });
  });

  describe('validateVisibilityChange', () => {
    it('should allow making Draft plans visible', () => {
      const result = validateVisibilityChange('Draft', false, true);
      expect(result.allowed).toBe(true);
    });

    it('should allow making Active plans visible', () => {
      const result = validateVisibilityChange('Active', false, true);
      expect(result.allowed).toBe(true);
    });

    it('should reject making Completed plans visible', () => {
      const result = validateVisibilityChange('Completed', false, true);
      expect(result.allowed).toBe(false);
      expect(result.error).toContain('Completed');
    });

    it('should reject making Cancelled plans visible', () => {
      const result = validateVisibilityChange('Cancelled', false, true);
      expect(result.allowed).toBe(false);
      expect(result.error).toContain('Cancelled');
    });

    it('should allow hiding any plan', () => {
      expect(validateVisibilityChange('Draft', true, false).allowed).toBe(true);
      expect(validateVisibilityChange('Active', true, false).allowed).toBe(true);
      expect(validateVisibilityChange('Completed', true, false).allowed).toBe(true);
    });
  });
});

describe('Slot Enforcement', () => {
  describe('canApproveParticipant', () => {
    it('should allow approval when slots available', () => {
      const result = canApproveParticipant(5, 3);
      expect(result.allowed).toBe(true);
      expect(result.slotsAvailable).toBe(2);
    });

    it('should reject approval when at capacity', () => {
      const result = canApproveParticipant(5, 5);
      expect(result.allowed).toBe(false);
      expect(result.error).toContain('full');
      expect(result.slotsAvailable).toBe(0);
    });

    it('should allow unlimited participants when max_slots is null', () => {
      const result = canApproveParticipant(null, 100);
      expect(result.allowed).toBe(true);
      expect(result.slotsAvailable).toBe(null);
    });
  });

  describe('validateMaxSlotsChange', () => {
    it('should allow increasing max_slots', () => {
      const result = validateMaxSlotsChange(10, 5);
      expect(result.allowed).toBe(true);
    });

    it('should allow setting max_slots equal to current count', () => {
      const result = validateMaxSlotsChange(5, 5);
      expect(result.allowed).toBe(true);
    });

    it('should reject reducing max_slots below current count', () => {
      const result = validateMaxSlotsChange(3, 5);
      expect(result.allowed).toBe(false);
      expect(result.error).toContain('Cannot reduce');
    });

    it('should allow setting max_slots to null (unlimited)', () => {
      const result = validateMaxSlotsChange(null, 5);
      expect(result.allowed).toBe(true);
    });
  });
});

describe('Date Validation', () => {
  describe('validateDateRange', () => {
    it('should allow valid date range', () => {
      const result = validateDateRange(
        new Date('2025-01-01'),
        new Date('2025-01-07')
      );
      expect(result.allowed).toBe(true);
    });

    it('should allow same start and end date', () => {
      const result = validateDateRange(
        new Date('2025-01-01'),
        new Date('2025-01-01')
      );
      expect(result.allowed).toBe(true);
    });

    it('should reject end date before start date', () => {
      const result = validateDateRange(
        new Date('2025-01-07'),
        new Date('2025-01-01')
      );
      expect(result.allowed).toBe(false);
      expect(result.error).toContain('before or equal');
    });

    it('should allow null dates', () => {
      expect(validateDateRange(null, null).allowed).toBe(true);
      expect(validateDateRange(new Date('2025-01-01'), null).allowed).toBe(true);
      expect(validateDateRange(null, new Date('2025-01-07')).allowed).toBe(true);
    });
  });
});

describe('Participant Role Rules', () => {
  describe('validateRoleDemotion', () => {
    it('should allow demoting Admin when multiple admins exist', () => {
      const result = validateRoleDemotion('Admin', 'Editor', 2);
      expect(result.allowed).toBe(true);
    });

    it('should reject demoting last Admin', () => {
      const result = validateRoleDemotion('Admin', 'Editor', 1);
      expect(result.allowed).toBe(false);
      expect(result.error).toContain('last admin');
    });

    it('should allow demoting non-Admin roles', () => {
      expect(validateRoleDemotion('Editor', 'Viewer', 1).allowed).toBe(true);
    });

    it('should allow promoting to Admin', () => {
      expect(validateRoleDemotion('Editor', 'Admin', 1).allowed).toBe(true);
    });
  });

  describe('validateParticipantRemoval', () => {
    it('should allow removing non-Admin', () => {
      const result = validateParticipantRemoval('Editor', true, 1);
      expect(result.allowed).toBe(true);
    });

    it('should allow removing unapproved Admin', () => {
      const result = validateParticipantRemoval('Admin', false, 1);
      expect(result.allowed).toBe(true);
    });

    it('should allow removing Admin when multiple admins exist', () => {
      const result = validateParticipantRemoval('Admin', true, 2);
      expect(result.allowed).toBe(true);
    });

    it('should reject removing last Admin', () => {
      const result = validateParticipantRemoval('Admin', true, 1);
      expect(result.allowed).toBe(false);
      expect(result.error).toContain('last admin');
    });
  });
});

describe('Permission System', () => {
  describe('getRolePermissions', () => {
    it('should return all permissions for Admin', () => {
      const perms = getRolePermissions('Admin');
      expect(perms).toContain('view');
      expect(perms).toContain('edit_plan');
      expect(perms).toContain('edit_activities');
      expect(perms).toContain('manage_participants');
    });

    it('should return limited permissions for Editor', () => {
      const perms = getRolePermissions('Editor');
      expect(perms).toContain('view');
      expect(perms).toContain('edit_activities');
      expect(perms).not.toContain('edit_plan');
      expect(perms).not.toContain('manage_participants');
    });

    it('should return view-only for Viewer', () => {
      const perms = getRolePermissions('Viewer');
      expect(perms).toEqual(['view']);
    });
  });

  describe('hasPermission', () => {
    it('should check Admin permissions correctly', () => {
      expect(hasPermission('Admin', 'view')).toBe(true);
      expect(hasPermission('Admin', 'edit_plan')).toBe(true);
      expect(hasPermission('Admin', 'edit_activities')).toBe(true);
      expect(hasPermission('Admin', 'manage_participants')).toBe(true);
    });

    it('should check Editor permissions correctly', () => {
      expect(hasPermission('Editor', 'view')).toBe(true);
      expect(hasPermission('Editor', 'edit_activities')).toBe(true);
      expect(hasPermission('Editor', 'edit_plan')).toBe(false);
      expect(hasPermission('Editor', 'manage_participants')).toBe(false);
    });

    it('should check Viewer permissions correctly', () => {
      expect(hasPermission('Viewer', 'view')).toBe(true);
      expect(hasPermission('Viewer', 'edit_activities')).toBe(false);
      expect(hasPermission('Viewer', 'edit_plan')).toBe(false);
    });
  });
});

describe('PlanStateMachine namespace', () => {
  it('should export all functions', () => {
    expect(PlanStateMachine.isValidTransition).toBeDefined();
    expect(PlanStateMachine.validateStatusTransition).toBeDefined();
    expect(PlanStateMachine.canAcceptParticipants).toBeDefined();
    expect(PlanStateMachine.isTerminalState).toBeDefined();
    expect(PlanStateMachine.canApproveParticipant).toBeDefined();
    expect(PlanStateMachine.validateMaxSlotsChange).toBeDefined();
    expect(PlanStateMachine.validateDateRange).toBeDefined();
  });

  it('should export constants', () => {
    expect(PlanStateMachine.JOINABLE_STATES).toEqual(['Draft', 'Active']);
    expect(PlanStateMachine.TERMINAL_STATES).toEqual(['Completed', 'Cancelled']);
  });
});

