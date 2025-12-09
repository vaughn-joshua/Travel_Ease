/**
 * TravelPlan DTO Mapper
 * 
 * Normalizes backend responses to consistent frontend types.
 * See docs/state-machines.md for the canonical field mappings.
 * 
 * Backend returns both naming conventions for compatibility:
 * - id/travel_plan_id, title/name, slots/max_slots, is_public/visibility
 * 
 * This mapper ensures consistent access using preferred frontend names.
 */

import type { TravelPlan, PlanStatus, Activity, BudgetRange } from "../../types/travelPlan";
import type { Participant } from "./fetch_participants";

// ============================================================================
// Status Helpers (aligned with docs/state-machines.md)
// ============================================================================

export const PLAN_STATUSES: PlanStatus[] = ["Draft", "Active", "Completed", "Cancelled"];
export const TERMINAL_STATUSES: PlanStatus[] = ["Completed", "Cancelled"];
export const JOINABLE_STATUSES: PlanStatus[] = ["Draft", "Active"];

/**
 * Check if a plan status is terminal (no further transitions allowed)
 */
export function isTerminalStatus(status: PlanStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

/**
 * Check if a plan can accept new participants
 */
export function canJoinPlan(plan: TravelPlan): boolean {
  return (
    JOINABLE_STATUSES.includes(plan.status) &&
    (plan.is_public ?? plan.visibility ?? false) &&
    !isPlanFull(plan)
  );
}

/**
 * Check if a plan is at capacity
 */
export function isPlanFull(plan: TravelPlan): boolean {
  const slots = plan.slots ?? plan.max_slots;
  if (slots === null || slots === undefined) return false;
  
  const approved = plan.approvedParticipants ?? plan.participantCount ?? 0;
  return approved >= slots;
}

/**
 * Get available slots for a plan
 */
export function getAvailableSlots(plan: TravelPlan): number | null {
  const slots = plan.slots ?? plan.max_slots;
  if (slots === null || slots === undefined) return null;
  
  const approved = plan.approvedParticipants ?? plan.participantCount ?? 0;
  return Math.max(0, slots - approved);
}

// ============================================================================
// Plan Status Transitions (aligned with docs/state-machines.md)
// ============================================================================

const STATUS_TRANSITIONS: Record<PlanStatus, PlanStatus[]> = {
  Draft: ["Active", "Cancelled"],
  Active: ["Completed", "Cancelled"],
  Completed: [],
  Cancelled: [],
};

/**
 * Get allowed status transitions from current status
 */
export function getAllowedTransitions(currentStatus: PlanStatus): PlanStatus[] {
  return STATUS_TRANSITIONS[currentStatus] || [];
}

/**
 * Check if a status transition is valid
 */
export function isValidTransition(from: PlanStatus, to: PlanStatus): boolean {
  if (from === to) return true;
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

// ============================================================================
// DTO Normalization (Backend → Frontend)
// ============================================================================

/**
 * Normalize a raw plan object from the API to ensure consistent field access.
 * Backend returns both naming conventions; this ensures we always use preferred names.
 */
export function normalizePlan(raw: any): TravelPlan {
  if (!raw) return raw;
  
  return {
    // Primary fields (use backend's normalized names with fallbacks)
    id: raw.id ?? raw.travel_plan_id,
    travel_plan_id: raw.travel_plan_id ?? raw.id,
    title: raw.title ?? raw.name,
    name: raw.name ?? raw.title,
    description: raw.description ?? null,
    location: raw.location ?? null,
    start_date: raw.start_date ?? null,
    end_date: raw.end_date ?? null,
    status: raw.status ?? "Draft",
    
    // Visibility (prefer is_public, fallback to visibility)
    is_public: raw.is_public ?? raw.visibility ?? false,
    visibility: raw.visibility ?? raw.is_public ?? false,
    
    // Slots (prefer slots, fallback to max_slots)
    slots: raw.slots ?? raw.max_slots ?? null,
    max_slots: raw.max_slots ?? raw.slots ?? null,
    
    // Participant counts
    approvedParticipants: raw.approvedParticipants ?? raw.participantCount ?? 0,
    slotsAvailable: raw.slotsAvailable ?? null,
    isFull: raw.isFull ?? false,
    participantCount: raw.participantCount ?? raw.approvedParticipants,
    
    // Optional fields
    user_id: raw.user_id,
    visibility_timestamp: raw.visibility_timestamp ?? null,
    visibility_end_date: raw.visibility_end_date ?? null,
    user: raw.user,
  };
}

/**
 * Normalize an array of plans
 */
export function normalizePlans(rawPlans: any[]): TravelPlan[] {
  if (!Array.isArray(rawPlans)) return [];
  return rawPlans.map(normalizePlan);
}

/**
 * Normalize an activity from the API
 */
export function normalizeActivity(raw: any): Activity {
  if (!raw) return raw;
  
  return {
    activity_id: raw.activity_id,
    travel_plan_id: raw.travel_plan_id,
    business_id: raw.business_id ?? null,
    user_id: raw.user_id,
    
    // Location fields
    location: raw.location ?? null,
    name: raw.name ?? null,
    lat: raw.lat ?? null,
    lng: raw.lng ?? null,
    brgy: raw.brgy ?? null,
    province: raw.province ?? null,
    city: raw.city ?? null,
    
    // Activity details
    notes: raw.notes ?? null,
    target_date: raw.target_date ?? null,
    budget_range: raw.budget_range as BudgetRange | null,
    is_priority: raw.is_priority ?? false,
    
    // User info (flattened from relation)
    first_name: raw.first_name ?? raw.user?.first_name,
    last_name: raw.last_name ?? raw.user?.last_name,
    
    // Business relation
    business: raw.business,
  };
}

/**
 * Normalize an array of activities
 */
export function normalizeActivities(rawActivities: any[]): Activity[] {
  if (!Array.isArray(rawActivities)) return [];
  return rawActivities.map(normalizeActivity);
}

// ============================================================================
// Payload Normalization (Frontend → Backend)
// ============================================================================

/**
 * Normalize a create plan payload for the backend.
 * Frontend uses preferred names; backend accepts both but prefers specific fields.
 */
export function normalizeCreatePlanPayload(data: {
  title: string;
  description?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  slots?: number;
  is_public?: boolean;
  collaborators?: Array<{
    user_id: number;
    role?: "Admin" | "Editor" | "Viewer";
    status?: boolean;
  }>;
}): Record<string, unknown> {
  return {
    title: data.title,
    description: data.description,
    location: data.location,
    start_date: data.start_date,
    end_date: data.end_date,
    max_slots: data.slots, // Backend prefers max_slots
    collaborators: data.collaborators,
    // Note: is_public is set during edit, not create (plans start as private)
  };
}

/**
 * Normalize an update plan payload for the backend.
 * Maps frontend names to backend expected fields.
 */
export function normalizeUpdatePlanPayload(data: {
  title?: string;
  description?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  slots?: number;
  is_public?: boolean;
  status?: PlanStatus;
}): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  
  if (data.title !== undefined) payload.name = data.title;
  if (data.description !== undefined) payload.description = data.description;
  if (data.location !== undefined) payload.location = data.location;
  if (data.start_date !== undefined) payload.start_date = data.start_date;
  if (data.end_date !== undefined) payload.end_date = data.end_date;
  if (data.slots !== undefined) payload.max_slots = data.slots;
  if (data.is_public !== undefined) payload.visibility = data.is_public;
  if (data.status !== undefined) payload.status = data.status;
  
  return payload;
}

// ============================================================================
// Participant Helpers
// ============================================================================

export type ParticipantRole = "Admin" | "Editor" | "Viewer";

/**
 * Check if a participant has admin permissions
 */
export function isAdmin(participant: Participant): boolean {
  return participant.role === "Admin" && participant.status === true;
}

/**
 * Check if a participant can edit activities
 */
export function canEditActivities(participant: Participant): boolean {
  return (
    participant.status === true &&
    (participant.role === "Admin" || participant.role === "Editor")
  );
}

/**
 * Check if a participant is pending approval
 */
export function isPending(participant: Participant): boolean {
  return participant.status === false;
}

/**
 * Get approved participants from a list
 */
export function getApprovedParticipants(participants: Participant[]): Participant[] {
  return participants.filter((p) => p.status === true);
}

/**
 * Get pending participants from a list
 */
export function getPendingParticipants(participants: Participant[]): Participant[] {
  return participants.filter((p) => p.status === false);
}

// ============================================================================
// Default Export
// ============================================================================

export const dtoMapper = {
  // Status helpers
  isTerminalStatus,
  canJoinPlan,
  isPlanFull,
  getAvailableSlots,
  getAllowedTransitions,
  isValidTransition,
  
  // Normalization
  normalizePlan,
  normalizePlans,
  normalizeActivity,
  normalizeActivities,
  normalizeCreatePlanPayload,
  normalizeUpdatePlanPayload,
  
  // Participant helpers
  isAdmin,
  canEditActivities,
  isPending,
  getApprovedParticipants,
  getPendingParticipants,
  
  // Constants
  PLAN_STATUSES,
  TERMINAL_STATUSES,
  JOINABLE_STATUSES,
};

export default dtoMapper;

