/**
 * Travel Plan Service
 * 
 * Business logic for travel plan operations extracted from controllers.
 * Controllers should use these functions and handle HTTP request/response.
 */

import { prisma, executeWithRetry } from '../lib/prismaHelpers.js';
import type { PaginationParams } from '../types/index.js';
import type { status_enum } from '@prisma/client';

// ============================================================================
// Types / DTOs
// ============================================================================

export interface TravelPlanDTO {
  id: number;
  title: string;
  slots: number | null;
  is_public: boolean;
  travel_plan_id: number;
  name: string;
  max_slots: number | null;
  visibility: boolean;
  user_id?: number | null;
  description: string | null;
  location: string | null;
  start_date: Date | null;
  end_date: Date | null;
  status: string;
  visibility_timestamp?: Date | null;
  visibility_end_date?: Date | null;
  approvedParticipants?: number;
  participantCount?: number;
}

export interface CreatePlanInput {
  title: string;
  description?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  max_slots?: number | null;
  collaborators?: Array<{
    user_id: number;
    role?: 'Admin' | 'Editor' | 'Viewer';
    status?: boolean;
  }>;
}

export interface UpdatePlanInput {
  name?: string;
  title?: string;
  description?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  max_slots?: number | null;
  visibility?: boolean;
  status?: 'Draft' | 'Active' | 'Completed' | 'Cancelled';
}

export interface PlanFilters {
  status?: string;
  search?: string;
}

// ============================================================================
// Select Clauses (for consistent field selection)
// ============================================================================

const PLAN_LIST_SELECT = {
  travel_plan_id: true,
  name: true,
  start_date: true,
  end_date: true,
  description: true,
  location: true,
  status: true,
  max_slots: true,
  visibility: true,
  user_id: true,
} as const;

const PLAN_DETAIL_SELECT = {
  ...PLAN_LIST_SELECT,
  visibility_timestamp: true,
  visibility_end_date: true,
  user: {
    select: {
      user_id: true,
      first_name: true,
      last_name: true,
      email: true,
    }
  },
  participants: {
    where: { status: true },
    select: {
      participant_id: true,
      user_id: true,
      role: true,
      user: {
        select: {
          user_id: true,
          first_name: true,
          last_name: true,
        }
      }
    }
  },
  _count: {
    select: {
      participants: { where: { status: true } },
      activities: true,
    }
  }
} as const;

// ============================================================================
// Formatters
// ============================================================================

/**
 * Format a raw Prisma plan to a normalized DTO
 */
export function formatPlanToDTO(plan: any, extras: Record<string, unknown> = {}): TravelPlanDTO {
  return {
    // Normalized fields (frontend-preferred)
    id: plan.travel_plan_id,
    title: plan.name,
    slots: plan.max_slots,
    is_public: plan.visibility ?? false,
    
    // Original fields for backward compatibility
    travel_plan_id: plan.travel_plan_id,
    name: plan.name,
    max_slots: plan.max_slots,
    visibility: plan.visibility ?? false,
    
    // Common fields
    user_id: plan.user_id,
    description: plan.description,
    location: plan.location,
    start_date: plan.start_date,
    end_date: plan.end_date,
    status: plan.status,
    visibility_timestamp: plan.visibility_timestamp,
    visibility_end_date: plan.visibility_end_date,
    
    // Merge any extras
    ...extras
  };
}

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Get plan IDs accessible by a user (as owner or approved participant)
 */
export async function getUserAccessiblePlanIds(userId: number): Promise<number[]> {
  const userPlanAccess = await executeWithRetry(() =>
    prisma.$queryRaw<{ travel_plan_id: number }[]>`
      SELECT DISTINCT tp.travel_plan_id 
      FROM "travel_plan" tp
      LEFT JOIN "participant" p ON tp.travel_plan_id = p.travel_plan_id AND p.user_id = ${userId} AND p.status = true
      WHERE tp.user_id = ${userId} OR p.participant_id IS NOT NULL
    `
  );
  return userPlanAccess.map(p => p.travel_plan_id);
}

/**
 * Fetch upcoming plans for a user (Draft + future Active)
 */
export async function getUpcomingPlans(
  userId: number,
  pagination: PaginationParams,
  filters: PlanFilters = {}
): Promise<{ data: TravelPlanDTO[]; total: number }> {
  const accessiblePlanIds = await getUserAccessiblePlanIds(userId);
  
  if (accessiblePlanIds.length === 0) {
    return { data: [], total: 0 };
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const where: any = {
    travel_plan_id: { in: accessiblePlanIds },
    OR: [
      { status: 'Draft' },
      { status: 'Active', start_date: { gt: today } }
    ],
  };

  // Apply status filter if provided
  if (filters.status) {
    where.status = filters.status;
    delete where.OR;
  }

  const [plans, total] = await executeWithRetry(() =>
    Promise.all([
      prisma.travelPlan.findMany({
        where,
        select: {
          ...PLAN_LIST_SELECT,
          _count: {
            select: { participants: { where: { status: true } } }
          }
        },
        orderBy: [{ start_date: 'asc' }, { travel_plan_id: 'desc' }],
        skip: pagination.skip,
        take: pagination.take
      }),
      prisma.travelPlan.count({ where })
    ])
  );

  const data = plans.map(p => formatPlanToDTO(p, {
    approvedParticipants: (p as any)._count?.participants ?? 0
  }));

  return { data, total };
}

/**
 * Fetch ongoing plans (Active with start_date <= today)
 */
export async function getOngoingPlans(
  userId: number,
  pagination: PaginationParams
): Promise<{ data: TravelPlanDTO[]; total: number }> {
  const accessiblePlanIds = await getUserAccessiblePlanIds(userId);
  
  if (accessiblePlanIds.length === 0) {
    return { data: [], total: 0 };
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const where = {
    travel_plan_id: { in: accessiblePlanIds },
    status: 'Active' as const,
    start_date: { lte: today }
  };

  const [plans, total] = await executeWithRetry(() =>
    Promise.all([
      prisma.travelPlan.findMany({
        where,
        select: {
          ...PLAN_LIST_SELECT,
          _count: {
            select: { participants: { where: { status: true } } }
          }
        },
        orderBy: [{ start_date: 'desc' }],
        skip: pagination.skip,
        take: pagination.take
      }),
      prisma.travelPlan.count({ where })
    ])
  );

  const data = plans.map(p => formatPlanToDTO(p, {
    approvedParticipants: (p as any)._count?.participants ?? 0
  }));

  return { data, total };
}

/**
 * Fetch previous (completed/cancelled) plans
 */
export async function getPreviousPlans(
  userId: number,
  pagination: PaginationParams,
  statusFilter?: 'Completed' | 'Cancelled'
): Promise<{ data: TravelPlanDTO[]; total: number }> {
  const accessiblePlanIds = await getUserAccessiblePlanIds(userId);
  
  if (accessiblePlanIds.length === 0) {
    return { data: [], total: 0 };
  }

  const validStatuses: status_enum[] = statusFilter 
    ? [statusFilter as status_enum] 
    : ['Completed' as status_enum, 'Cancelled' as status_enum];

  const where = {
    travel_plan_id: { in: accessiblePlanIds },
    status: { in: validStatuses }
  };

  const [plans, total] = await executeWithRetry(() =>
    Promise.all([
      prisma.travelPlan.findMany({
        where,
        select: PLAN_LIST_SELECT,
        orderBy: [{ end_date: 'desc' }],
        skip: pagination.skip,
        take: pagination.take
      }),
      prisma.travelPlan.count({ where })
    ])
  );

  const data = plans.map(p => formatPlanToDTO(p));
  return { data, total };
}

/**
 * Get a single plan by ID with full details
 */
export async function getPlanById(planId: number): Promise<TravelPlanDTO | null> {
  const plan = await executeWithRetry(() =>
    prisma.travelPlan.findUnique({
      where: { travel_plan_id: planId },
      select: PLAN_DETAIL_SELECT
    })
  );

  if (!plan) return null;

  return formatPlanToDTO(plan, {
    approvedParticipants: (plan as any)._count?.participants ?? 0,
    activityCount: (plan as any)._count?.activities ?? 0,
    participants: (plan as any).participants,
    owner: (plan as any).user
  });
}

/**
 * Create a new travel plan with optional collaborators
 */
export async function createPlan(
  userId: number,
  input: CreatePlanInput
): Promise<TravelPlanDTO> {
  const { title, description, location, start_date, end_date, max_slots, collaborators = [] } = input;

  const result = await prisma.$transaction(async (tx) => {
    // Create travel plan
    const travelPlan = await tx.travelPlan.create({
      data: {
        name: title,
        user_id: userId,
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
        description,
        max_slots: max_slots ?? null,
        location,
        status: 'Draft'
      }
    });

    // Add creator as Admin participant
    await tx.participant.create({
      data: {
        travel_plan_id: travelPlan.travel_plan_id,
        user_id: userId,
        role: 'Admin',
        status: true
      }
    });

    // Add collaborators with slot enforcement
    if (collaborators.length > 0) {
      let approvedCount = 1; // Creator counts as 1 approved
      
      for (const collab of collaborators) {
        if (!collab.user_id || collab.user_id === userId) continue;
        
        const wantsApproved = collab.status === true;
        
        // Skip if would exceed max_slots
        if (wantsApproved && max_slots && approvedCount >= max_slots) continue;
        
        await tx.participant.create({
          data: {
            travel_plan_id: travelPlan.travel_plan_id,
            user_id: collab.user_id,
            role: collab.role || 'Viewer',
            status: wantsApproved
          }
        });
        
        if (wantsApproved) approvedCount++;
      }
    }

    return travelPlan;
  });

  return formatPlanToDTO(result);
}

/**
 * Update an existing travel plan
 */
export async function updatePlan(
  planId: number,
  input: UpdatePlanInput
): Promise<TravelPlanDTO> {
  const updateData: any = {};
  
  if (input.name !== undefined || input.title !== undefined) {
    updateData.name = input.name || input.title;
  }
  if (input.description !== undefined) updateData.description = input.description;
  if (input.location !== undefined) updateData.location = input.location;
  if (input.start_date !== undefined) {
    updateData.start_date = input.start_date ? new Date(input.start_date) : null;
  }
  if (input.end_date !== undefined) {
    updateData.end_date = input.end_date ? new Date(input.end_date) : null;
  }
  if (input.max_slots !== undefined) updateData.max_slots = input.max_slots;
  if (input.visibility !== undefined) updateData.visibility = input.visibility;
  if (input.status !== undefined) updateData.status = input.status;

  const updated = await executeWithRetry(() =>
    prisma.travelPlan.update({
      where: { travel_plan_id: planId },
      data: updateData,
      select: PLAN_DETAIL_SELECT
    })
  );

  return formatPlanToDTO(updated, {
    approvedParticipants: (updated as any)._count?.participants ?? 0
  });
}

/**
 * Delete a travel plan
 */
export async function deletePlan(planId: number): Promise<void> {
  await executeWithRetry(() =>
    prisma.travelPlan.delete({
      where: { travel_plan_id: planId }
    })
  );
}

/**
 * Check if user has access to a plan (as owner or participant)
 */
export async function userHasPlanAccess(userId: number, planId: number): Promise<boolean> {
  const plan = await executeWithRetry(() =>
    prisma.travelPlan.findFirst({
      where: {
        travel_plan_id: planId,
        OR: [
          { user_id: userId },
          { participants: { some: { user_id: userId, status: true } } }
        ]
      },
      select: { travel_plan_id: true }
    })
  );
  return plan !== null;
}

/**
 * Check if user is the owner of a plan
 */
export async function userIsPlanOwner(userId: number, planId: number): Promise<boolean> {
  const plan = await executeWithRetry(() =>
    prisma.travelPlan.findFirst({
      where: { travel_plan_id: planId, user_id: userId },
      select: { travel_plan_id: true }
    })
  );
  return plan !== null;
}

export default {
  formatPlanToDTO,
  getUserAccessiblePlanIds,
  getUpcomingPlans,
  getOngoingPlans,
  getPreviousPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
  userHasPlanAccess,
  userIsPlanOwner,
};

