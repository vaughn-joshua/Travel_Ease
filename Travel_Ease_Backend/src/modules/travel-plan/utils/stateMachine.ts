/**
 * TravelPlan State Machine
 * 
 * Centralized state transition logic and invariant checks.
 * See docs/state-machines.md for the canonical state diagram.
 */

import type { status_enum, participant_role } from '@prisma/client';

// ============================================================================
// Types
// ============================================================================

export type PlanStatus = 'Draft' | 'Active' | 'Completed' | 'Cancelled';

export interface PlanState {
  status: PlanStatus;
  visibility: boolean;
  max_slots: number | null;
  start_date: Date | null;
  end_date: Date | null;
}

export interface TransitionResult {
  allowed: boolean;
  error?: string;
  sideEffects?: Partial<PlanState>;
}

export interface SlotCheckResult {
  allowed: boolean;
  error?: string;
  approvedCount: number;
  slotsAvailable: number | null;
}

// ============================================================================
// Status Transition Rules
// ============================================================================

const STATUS_TRANSITIONS: Record<PlanStatus, PlanStatus[]> = {
  Draft: ['Active', 'Cancelled'],
  Active: ['Completed', 'Cancelled'],
  Completed: [], // Terminal state
  Cancelled: [], // Terminal state
};

const TERMINAL_STATES: PlanStatus[] = ['Completed', 'Cancelled'];
const JOINABLE_STATES: PlanStatus[] = ['Draft', 'Active'];

// ============================================================================
// Status Transition Functions
// ============================================================================

/**
 * Check if a status transition is valid
 */
export function isValidTransition(from: PlanStatus | null, to: PlanStatus | null): boolean {
  if (!from || !to) return true;
  if (from === to) return true;
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Validate a status transition and return side effects
 */
export function validateStatusTransition(
  current: PlanStatus,
  next: PlanStatus
): TransitionResult {
  // Same state is always allowed
  if (current === next) {
    return { allowed: true };
  }

  // Check if transition is valid
  const allowed = STATUS_TRANSITIONS[current]?.includes(next) ?? false;
  
  if (!allowed) {
    const allowedTransitions = STATUS_TRANSITIONS[current]?.join(', ') || 'none';
    return {
      allowed: false,
      error: `Cannot transition from ${current} to ${next}. Allowed: ${allowedTransitions}`,
    };
  }

  // Compute side effects
  const sideEffects: Partial<PlanState> = {};
  
  // Terminal states force visibility off
  if (TERMINAL_STATES.includes(next)) {
    sideEffects.visibility = false;
  }

  return { allowed: true, sideEffects };
}

/**
 * Check if a plan can accept new participants
 */
export function canAcceptParticipants(status: PlanStatus, visibility: boolean): boolean {
  return JOINABLE_STATES.includes(status) && visibility;
}

/**
 * Check if plan is in a terminal state
 */
export function isTerminalState(status: PlanStatus): boolean {
  return TERMINAL_STATES.includes(status);
}

// ============================================================================
// Visibility Rules
// ============================================================================

/**
 * Validate visibility change and compute side effects
 */
export function validateVisibilityChange(
  currentStatus: PlanStatus,
  currentVisibility: boolean,
  newVisibility: boolean
): TransitionResult {
  // Cannot enable visibility on terminal states
  if (newVisibility && TERMINAL_STATES.includes(currentStatus)) {
    return {
      allowed: false,
      error: `Cannot enable visibility on ${currentStatus} plans`,
    };
  }

  const sideEffects: Partial<PlanState> = {};

  // Set visibility_timestamp when making visible
  if (newVisibility && !currentVisibility) {
    // Side effect: set visibility_timestamp = now
    // (handled in controller since we return partial state)
  }

  return { allowed: true, sideEffects };
}

// ============================================================================
// Slot Enforcement
// ============================================================================

/**
 * Check if a new participant can be approved given slot limits
 */
export function canApproveParticipant(
  maxSlots: number | null,
  approvedCount: number
): SlotCheckResult {
  const slotsAvailable = maxSlots !== null ? maxSlots - approvedCount : null;
  
  if (maxSlots !== null && approvedCount >= maxSlots) {
    return {
      allowed: false,
      error: `Plan is full. Maximum slots (${maxSlots}) reached`,
      approvedCount,
      slotsAvailable: 0,
    };
  }

  return {
    allowed: true,
    approvedCount,
    slotsAvailable,
  };
}

/**
 * Validate max_slots reduction
 */
export function validateMaxSlotsChange(
  newMaxSlots: number | null,
  approvedCount: number
): TransitionResult {
  if (newMaxSlots !== null && newMaxSlots < approvedCount) {
    return {
      allowed: false,
      error: `Cannot reduce max_slots to ${newMaxSlots}. Current approved participants: ${approvedCount}`,
    };
  }
  return { allowed: true };
}

// ============================================================================
// Date Validation
// ============================================================================

/**
 * Validate date range (start_date <= end_date)
 */
export function validateDateRange(
  startDate: Date | null,
  endDate: Date | null
): TransitionResult {
  if (startDate && endDate && startDate > endDate) {
    return {
      allowed: false,
      error: 'Start date must be before or equal to end date',
    };
  }
  return { allowed: true };
}

// ============================================================================
// Participant Role Rules
// ============================================================================

const ROLE_HIERARCHY: Record<participant_role, number> = {
  Admin: 3,
  Editor: 2,
  Viewer: 1,
};

/**
 * Check if demoting a role would remove the last admin
 */
export function validateRoleDemotion(
  currentRole: participant_role,
  newRole: participant_role,
  adminCount: number
): TransitionResult {
  if (currentRole === 'Admin' && newRole !== 'Admin' && adminCount <= 1) {
    return {
      allowed: false,
      error: 'Cannot demote the last admin. Promote another participant first',
    };
  }
  return { allowed: true };
}

/**
 * Check if removing a participant would leave no admins
 */
export function validateParticipantRemoval(
  role: participant_role,
  isApproved: boolean,
  adminCount: number
): TransitionResult {
  if (role === 'Admin' && isApproved && adminCount <= 1) {
    return {
      allowed: false,
      error: 'Cannot remove the last admin from the plan',
    };
  }
  return { allowed: true };
}

// ============================================================================
// Permission Checks
// ============================================================================

export type PlanPermission = 'view' | 'edit_plan' | 'edit_activities' | 'manage_participants';

/**
 * Get permissions for a user's role
 */
export function getRolePermissions(role: participant_role): PlanPermission[] {
  switch (role) {
    case 'Admin':
      return ['view', 'edit_plan', 'edit_activities', 'manage_participants'];
    case 'Editor':
      return ['view', 'edit_activities'];
    case 'Viewer':
      return ['view'];
    default:
      return [];
  }
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: participant_role, permission: PlanPermission): boolean {
  return getRolePermissions(role).includes(permission);
}

// ============================================================================
// Plan Classification for UI
// ============================================================================

/**
 * UI classification categories for travel plans.
 * Each plan falls into exactly one category for display purposes.
 */
export type PlanClassification = 'ongoing' | 'upcoming' | 'previous';

export interface ClassificationResult {
  classification: PlanClassification;
  isPublic: boolean;
  isJoinable: boolean;
}

/**
 * Classify a travel plan for UI display purposes.
 * 
 * Classification rules (based on status and dates):
 * - ONGOING: status='Active' (regardless of dates - user explicitly activated it)
 * - UPCOMING: status='Draft' (being prepared, not yet active)
 * - PREVIOUS: status='Completed' or 'Cancelled' (terminal states)
 * 
 * Public/Joinable:
 * - A plan is public if visibility=true
 * - A plan is joinable if public AND status in ['Draft', 'Active']
 * 
 * @param plan - The travel plan to classify
 * @param _now - Current date (optional, for future date-based logic)
 * @returns Classification result with category and flags
 */
export function classifyPlanState(
  plan: {
    status: PlanStatus;
    visibility?: boolean | null;
    start_date?: Date | null;
    end_date?: Date | null;
  },
  _now: Date = new Date()
): ClassificationResult {
  const status = plan.status;
  const visibility = plan.visibility ?? false;
  
  // Determine classification based on status
  let classification: PlanClassification;
  
  if (TERMINAL_STATES.includes(status)) {
    // Completed or Cancelled -> Previous
    classification = 'previous';
  } else if (status === 'Active') {
    // Active -> Ongoing (user explicitly started the plan)
    classification = 'ongoing';
  } else {
    // Draft -> Upcoming (still being prepared)
    classification = 'upcoming';
  }
  
  // Determine if joinable
  const isJoinable = visibility && JOINABLE_STATES.includes(status);
  
  return {
    classification,
    isPublic: visibility,
    isJoinable,
  };
}

/**
 * Filter plans by classification.
 * Useful for backend filtering before sending to frontend.
 */
export function filterPlansByClassification<T extends { status: PlanStatus }>(
  plans: T[],
  targetClassification: PlanClassification,
  now: Date = new Date()
): T[] {
  return plans.filter(plan => {
    const { classification } = classifyPlanState(plan, now);
    return classification === targetClassification;
  });
}

// ============================================================================
// Export convenience object
// ============================================================================

export const PlanStateMachine = {
  // Status transitions
  isValidTransition,
  validateStatusTransition,
  canAcceptParticipants,
  isTerminalState,
  validateVisibilityChange,
  // Slot management
  canApproveParticipant,
  validateMaxSlotsChange,
  // Date validation
  validateDateRange,
  // Participant management
  validateRoleDemotion,
  validateParticipantRemoval,
  // Permissions
  getRolePermissions,
  hasPermission,
  // Classification
  classifyPlanState,
  filterPlansByClassification,
  // Constants
  JOINABLE_STATES,
  TERMINAL_STATES,
};

export default PlanStateMachine;

