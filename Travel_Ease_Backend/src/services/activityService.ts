/**
 * Activity Service
 * 
 * Business logic for activity operations extracted from controllers.
 * Controllers should use these functions and handle HTTP request/response.
 */

import { prisma, executeWithRetry } from '../lib/prismaHelpers.js';

// ============================================================================
// Types / DTOs
// ============================================================================

export interface ActivityDTO {
  id: number;
  activity_id: number;
  travel_plan_id: number | null;
  business_id: number | null;
  user_id: number | null;
  notes: string | null;
  target_date: Date | null;
  budget_range: string | null;
  is_priority: boolean;
  lat: number | null;
  lng: number | null;
  name: string | null;
  location: string | null;
  brgy: string | null;
  province: string | null;
  city: string | null;
  business?: BusinessInfo | null;
}

export interface BusinessInfo {
  business_id: number;
  name: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  rating: number | null;
}

export interface CreateActivityInput {
  travel_plan_id: number;
  notes?: string;
  target_date?: string;
  budget_range?: string;
  business_id?: number;
  lat?: number | string;
  lng?: number | string;
  location?: string;
  name?: string;
  brgy?: string;
  province?: string;
  city?: string;
}

export interface UpdateActivityInput {
  notes?: string;
  target_date?: string;
  budget_range?: string;
  is_priority?: boolean;
  lat?: number | string;
  lng?: number | string;
  location?: string;
  name?: string;
  brgy?: string;
  province?: string;
  city?: string;
}

// ============================================================================
// Budget Range Normalization
// ============================================================================

const BUDGET_RANGE_MAP: Record<string, string> = {
  'RANGE_0_100': '0-100',
  'RANGE_100_200': '100-200',
  'RANGE_200_400': '200-400',
  'RANGE_400_700': '400-700',
  'RANGE_700_1000': '700-1000',
  'RANGE_1000_1500': '1000-1500',
  'RANGE_1500_PLUS': '1500+',
  // Already normalized values map to themselves
  '0-100': '0-100',
  '100-200': '100-200',
  '200-400': '200-400',
  '400-700': '400-700',
  '700-1000': '700-1000',
  '1000-1500': '1000-1500',
  '1500+': '1500+',
};

/**
 * Normalize budget range from API format to DB format
 */
export function normalizeBudgetRange(range: string | undefined | null): string | null {
  if (!range) return null;
  return BUDGET_RANGE_MAP[range] || null;
}

// ============================================================================
// Select Clauses
// ============================================================================

const ACTIVITY_SELECT = {
  activity_id: true,
  travel_plan_id: true,
  business_id: true,
  user_id: true,
  notes: true,
  target_date: true,
  budget_range: true,
  is_priority: true,
  lat: true,
  lng: true,
  name: true,
  location: true,
  brgy: true,
  province: true,
  city: true,
} as const;

const ACTIVITY_WITH_BUSINESS_SELECT = {
  ...ACTIVITY_SELECT,
  business: {
    select: {
      business_id: true,
      name: true,
      description: true,
      latitude: true,
      longtitude: true, // Note: DB column has typo
      city: true,
      rating: true,
    }
  }
} as const;

// ============================================================================
// Formatters
// ============================================================================

/**
 * Format raw Prisma activity to DTO
 */
export function formatActivityToDTO(activity: any): ActivityDTO {
  return {
    id: activity.activity_id,
    activity_id: activity.activity_id,
    travel_plan_id: activity.travel_plan_id,
    business_id: activity.business_id,
    user_id: activity.user_id,
    notes: activity.notes,
    target_date: activity.target_date,
    budget_range: activity.budget_range,
    is_priority: activity.is_priority ?? false,
    lat: activity.lat,
    lng: activity.lng,
    name: activity.name,
    location: activity.location,
    brgy: activity.brgy,
    province: activity.province,
    city: activity.city,
    business: activity.business ? {
      business_id: activity.business.business_id,
      name: activity.business.name,
      description: activity.business.description,
      latitude: activity.business.latitude,
      longitude: activity.business.longtitude, // Map DB typo to correct API field name
      city: activity.business.city,
      rating: activity.business.rating ? parseFloat(activity.business.rating) : null,
    } : null,
  };
}

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Get all activities for a travel plan (excluding accommodation activities)
 */
export async function getActivitiesByPlan(planId: number): Promise<ActivityDTO[]> {
  const activities = await executeWithRetry(() =>
    prisma.activity.findMany({
      where: { 
        travel_plan_id: planId,
        is_accommodation: { not: true } // Exclude accommodation activities
      },
      select: ACTIVITY_WITH_BUSINESS_SELECT,
      orderBy: [
        { target_date: 'asc' },
        { is_priority: 'desc' },
        { activity_id: 'asc' }
      ]
    })
  );

  return activities.map(formatActivityToDTO);
}

/**
 * Get accommodation activity for a travel plan
 */
export async function getAccommodationByPlan(planId: number): Promise<{ business_id: number; name: string } | null> {
  const accommodation = await executeWithRetry(() =>
    prisma.activity.findFirst({
      where: {
        travel_plan_id: planId,
        is_accommodation: true
      },
      select: {
        business_id: true,
        business: {
          select: {
            business_id: true,
            name: true
          }
        }
      }
    })
  );

  if (!accommodation || !accommodation.business) {
    return null;
  }

  return {
    business_id: accommodation.business.business_id,
    name: accommodation.business.name
  };
}

/**
 * Get a single activity by ID
 */
export async function getActivityById(activityId: number): Promise<ActivityDTO | null> {
  const activity = await executeWithRetry(() =>
    prisma.activity.findUnique({
      where: { activity_id: activityId },
      select: ACTIVITY_WITH_BUSINESS_SELECT
    })
  );

  if (!activity) return null;
  return formatActivityToDTO(activity);
}

/**
 * Create a new activity
 */
export async function createActivity(
  userId: number,
  input: CreateActivityInput
): Promise<ActivityDTO> {
  const activity = await executeWithRetry(() =>
    prisma.activity.create({
      data: {
        travel_plan_id: input.travel_plan_id,
        user_id: userId,
        business_id: input.business_id ?? null,
        notes: input.notes ?? null,
        target_date: input.target_date ? new Date(input.target_date) : null,
        budget_range: normalizeBudgetRange(input.budget_range) as any,
        lat: input.lat ? (typeof input.lat === 'string' ? parseFloat(input.lat) : input.lat) : null,
        lng: input.lng ? (typeof input.lng === 'string' ? parseFloat(input.lng) : input.lng) : null,
        location: input.location ?? null,
        name: input.name ?? null,
        brgy: input.brgy ?? null,
        province: input.province ?? null,
        city: input.city ?? null,
      },
      select: ACTIVITY_WITH_BUSINESS_SELECT
    })
  );

  return formatActivityToDTO(activity);
}

/**
 * Update an existing activity
 */
export async function updateActivity(
  activityId: number,
  input: UpdateActivityInput
): Promise<ActivityDTO> {
  const updateData: any = {};
  
  if (input.notes !== undefined) updateData.notes = input.notes;
  if (input.target_date !== undefined) {
    updateData.target_date = input.target_date ? new Date(input.target_date) : null;
  }
  if (input.budget_range !== undefined) {
    updateData.budget_range = normalizeBudgetRange(input.budget_range);
  }
  if (input.is_priority !== undefined) updateData.is_priority = input.is_priority;
  if (input.lat !== undefined) {
    updateData.lat = input.lat ? (typeof input.lat === 'string' ? parseFloat(input.lat) : input.lat) : null;
  }
  if (input.lng !== undefined) {
    updateData.lng = input.lng ? (typeof input.lng === 'string' ? parseFloat(input.lng) : input.lng) : null;
  }
  if (input.location !== undefined) updateData.location = input.location;
  if (input.name !== undefined) updateData.name = input.name;
  if (input.brgy !== undefined) updateData.brgy = input.brgy;
  if (input.province !== undefined) updateData.province = input.province;
  if (input.city !== undefined) updateData.city = input.city;

  const activity = await executeWithRetry(() =>
    prisma.activity.update({
      where: { activity_id: activityId },
      data: updateData,
      select: ACTIVITY_WITH_BUSINESS_SELECT
    })
  );

  return formatActivityToDTO(activity);
}

/**
 * Delete an activity
 */
export async function deleteActivity(activityId: number): Promise<void> {
  await executeWithRetry(() =>
    prisma.activity.delete({
      where: { activity_id: activityId }
    })
  );
}

/**
 * Bulk create activities (for importing/copying plans)
 */
export async function bulkCreateActivities(
  userId: number,
  activities: CreateActivityInput[]
): Promise<ActivityDTO[]> {
  const created = await prisma.$transaction(
    activities.map(input => 
      prisma.activity.create({
        data: {
          travel_plan_id: input.travel_plan_id,
          user_id: userId,
          business_id: input.business_id ?? null,
          notes: input.notes ?? null,
          target_date: input.target_date ? new Date(input.target_date) : null,
          budget_range: normalizeBudgetRange(input.budget_range) as any,
          lat: input.lat ? (typeof input.lat === 'string' ? parseFloat(input.lat) : input.lat) : null,
          lng: input.lng ? (typeof input.lng === 'string' ? parseFloat(input.lng) : input.lng) : null,
          location: input.location ?? null,
          name: input.name ?? null,
          brgy: input.brgy ?? null,
          province: input.province ?? null,
          city: input.city ?? null,
        },
        select: ACTIVITY_WITH_BUSINESS_SELECT
      })
    )
  );

  return created.map(formatActivityToDTO);
}

/**
 * Get activities for multiple plans (for batch loading)
 */
export async function getActivitiesByPlans(planIds: number[]): Promise<Map<number, ActivityDTO[]>> {
  if (planIds.length === 0) return new Map();

  const activities = await executeWithRetry(() =>
    prisma.activity.findMany({
      where: { travel_plan_id: { in: planIds } },
      select: ACTIVITY_WITH_BUSINESS_SELECT,
      orderBy: [
        { travel_plan_id: 'asc' },
        { target_date: 'asc' },
        { is_priority: 'desc' }
      ]
    })
  );

  // Group by travel_plan_id
  const result = new Map<number, ActivityDTO[]>();
  for (const activity of activities) {
    const planId = activity.travel_plan_id;
    if (planId === null) continue;
    
    const formatted = formatActivityToDTO(activity);
    const existing = result.get(planId) || [];
    existing.push(formatted);
    result.set(planId, existing);
  }

  return result;
}

/**
 * Check if activity belongs to a plan the user has access to
 */
export async function getActivityWithPlanAccess(
  activityId: number,
  userId: number
): Promise<{ activity: ActivityDTO; hasAccess: boolean; isOwner: boolean } | null> {
  const activity = await executeWithRetry(() =>
    prisma.activity.findUnique({
      where: { activity_id: activityId },
      select: {
        ...ACTIVITY_WITH_BUSINESS_SELECT,
        travel_plan: {
          select: {
            travel_plan_id: true,
            user_id: true,
            participant: {
              where: { user_id: userId, status: true },
              select: { participant_id: true }
            }
          }
        }
      }
    })
  );

  if (!activity) return null;

  const isOwner = activity.travel_plan?.user_id === userId;
  const isParticipant = (activity.travel_plan?.participant?.length ?? 0) > 0;
  const hasAccess = isOwner || isParticipant;

  return {
    activity: formatActivityToDTO(activity),
    hasAccess,
    isOwner
  };
}

export default {
  normalizeBudgetRange,
  formatActivityToDTO,
  getActivitiesByPlan,
  getActivityById,
  createActivity,
  updateActivity,
  deleteActivity,
  bulkCreateActivities,
  getActivitiesByPlans,
  getActivityWithPlanAccess,
};

