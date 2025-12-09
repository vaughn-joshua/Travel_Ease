/**
 * Shared formatter for TravelPlan DTOs
 * Normalizes backend field names to a consistent shape for the frontend:
 *   - id (from travel_plan_id)
 *   - title (from name)
 *   - slots (from max_slots)
 *   - is_public (from visibility)
 *   - status (PascalCase: Draft, Active, Completed, Cancelled)
 *
 * Also includes original fields for backward compatibility.
 */

import type { travel_plan as TravelPlan, user as User } from '@prisma/client';

interface PlanWithUser extends Partial<TravelPlan> {
  travel_plan_id: number;
  name: string;
  user?: Partial<User> | null;
  toJSON?: () => any;
}

interface PlanDTO {
  id: number;
  title: string;
  slots: number | null;
  is_public: boolean;
  travel_plan_id: number;
  name: string;
  max_slots: number | null;
  visibility: boolean;
  user_id?: number;
  description: string | null;
  location: string | null;
  start_date: Date | null;
  end_date: Date | null;
  status: string | null;
  visibility_timestamp?: Date | null;
  visibility_end_date?: Date | null;
  user?: any;
  accommodation?: {
    business_id: number;
    name: string;
    lat?: number | null;
    lng?: number | null;
  } | null;
}

/**
 * Format a single plan to the normalized DTO shape
 */
export function formatPlan(plan: PlanWithUser, extras: Record<string, unknown> = {}): PlanDTO & Record<string, unknown> {
  // Handle plain object (Prisma returns plain objects by default)
  const data = plan.toJSON ? plan.toJSON() : plan;

  return {
    // Normalized fields (frontend-preferred)
    id: data.travel_plan_id,
    title: data.name,
    slots: data.max_slots,
    is_public: data.visibility ?? false,
    
    // Original fields for backward compatibility
    travel_plan_id: data.travel_plan_id,
    name: data.name,
    max_slots: data.max_slots,
    visibility: data.visibility ?? false,
    
    // Common fields
    user_id: data.user_id,
    description: data.description,
    location: data.location,
    start_date: data.start_date,
    end_date: data.end_date,
    status: data.status, // Already PascalCase from DB
    visibility_timestamp: data.visibility_timestamp,
    visibility_end_date: data.visibility_end_date,
    
    // Include user relation if present
    ...(plan.user && { user: plan.user }),
    
    // Merge any extras (e.g., approvedParticipants, slotsAvailable)
    ...extras
  };
}

/**
 * Format an array of plans
 */
export function formatPlans(
  plans: PlanWithUser[], 
  extrasMapper: (plan: PlanWithUser) => Record<string, unknown> = () => ({})
): Array<PlanDTO & Record<string, unknown>> {
  return plans.map(plan => formatPlan(plan, extrasMapper(plan)));
}

