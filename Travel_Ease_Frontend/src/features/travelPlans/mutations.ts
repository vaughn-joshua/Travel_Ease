/**
 * Travel Plan Mutation Hooks
 *
 * TanStack Query mutations for travel plan write operations.
 * All hooks use the centralized travelPlanApi service which handles auth automatically.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { travelPlanApi } from "../../services/travelPlanApi";
import { travelPlanKeys } from "../../lib/queryKeys";
import type {
  TravelPlan,
  CreatePlanPayload,
  UpdatePlanPayload,
  CreateActivityPayload,
  UpdateActivityPayload,
  QuickJoinPayload,
} from "../../types/travelPlan";

// ─────────────────────────────────────────────────────────────────────────────
// Plan Mutations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * useCreatePlan
 * Creates a new travel plan.
 * Invalidates all plan lists on success.
 */
export function useCreatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePlanPayload) => travelPlanApi.createPlan(data),
    onSuccess: () => {
      // Invalidate all plan lists so they refetch with the new plan
      queryClient.invalidateQueries({ queryKey: travelPlanKeys.lists() });
      queryClient.invalidateQueries({ queryKey: travelPlanKeys.ongoing() });
    },
  });
}

/**
 * useUpdatePlan
 * Updates an existing travel plan.
 * Invalidates the specific plan detail and all lists on success.
 */
export function useUpdatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number | string;
      data: UpdatePlanPayload;
    }) => travelPlanApi.updatePlan(id, data),
    onSuccess: (_data, variables) => {
      // Invalidate the specific plan detail
      queryClient.invalidateQueries({
        queryKey: travelPlanKeys.detail(variables.id),
      });
      // Invalidate all lists (status changes might move plans between lists)
      queryClient.invalidateQueries({ queryKey: travelPlanKeys.lists() });
      queryClient.invalidateQueries({ queryKey: travelPlanKeys.ongoing() });
      queryClient.invalidateQueries({ queryKey: travelPlanKeys.previous() });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Activity Mutations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * useCreateActivity
 * Creates a new activity in a travel plan.
 * Invalidates the activities for the specific plan on success.
 */
export function useCreateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateActivityPayload) =>
      travelPlanApi.createActivity(data),
    onSuccess: (_data, variables) => {
      // Invalidate activities for the specific plan
      queryClient.invalidateQueries({
        queryKey: travelPlanKeys.activities(variables.travel_plan_id),
      });
    },
  });
}

/**
 * useUpdateActivity
 * Updates an existing activity.
 * Takes planId for cache invalidation.
 */
export function useUpdateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      activityId,
      data,
    }: {
      activityId: number | string;
      planId: number | string;
      data: UpdateActivityPayload;
    }) => travelPlanApi.updateActivity(activityId, data),
    onSuccess: (_data, variables) => {
      // Invalidate activities for the specific plan
      queryClient.invalidateQueries({
        queryKey: travelPlanKeys.activities(variables.planId),
      });
    },
  });
}

/**
 * useDeleteActivity
 * Deletes an activity from a travel plan.
 * Uses optimistic update for snappy UX.
 */
export function useDeleteActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      activityId,
    }: {
      activityId: number | string;
      planId: number | string;
    }) => travelPlanApi.deleteActivity(activityId),
    onSuccess: (_data, variables) => {
      // Invalidate activities for the specific plan
      queryClient.invalidateQueries({
        queryKey: travelPlanKeys.activities(variables.planId),
      });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Join / Request Mutations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * useQuickJoinSearch
 * Searches for public plans matching criteria.
 * This is a mutation because it POSTs search criteria (not idempotent GET).
 * Returns the matching plans directly.
 */
export function useQuickJoinSearch() {
  return useMutation({
    mutationFn: (data: QuickJoinPayload) => travelPlanApi.quickJoinSearch(data),
  });
}

/**
 * useJoinPlan
 * Directly joins a travel plan.
 */
export function useJoinPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { travel_plan_id: number; role?: string }) =>
      travelPlanApi.joinPlan(data),
    onSuccess: (_data, variables) => {
      // Invalidate the plan detail and public plans list
      queryClient.invalidateQueries({
        queryKey: travelPlanKeys.detail(variables.travel_plan_id),
      });
      queryClient.invalidateQueries({ queryKey: travelPlanKeys.public() });
      // Also invalidate ongoing plans since user may now see the plan there
      queryClient.invalidateQueries({ queryKey: travelPlanKeys.ongoing() });
    },
  });
}

/**
 * useRequestJoin
 * Requests to join a travel plan (requires owner approval).
 */
export function useRequestJoin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { travel_plan_id: number }) =>
      travelPlanApi.requestJoin(data),
    onSuccess: (_data, variables) => {
      // Invalidate the plan detail
      queryClient.invalidateQueries({
        queryKey: travelPlanKeys.detail(variables.travel_plan_id),
      });
      queryClient.invalidateQueries({ queryKey: travelPlanKeys.public() });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Participant Mutations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * useRemoveParticipant
 * Removes a participant from a travel plan.
 */
export function useRemoveParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, userId }: { planId: number | string; userId: number }) =>
      travelPlanApi.removeParticipant(planId, userId),
    onSuccess: (_data, variables) => {
      // Invalidate participants for the specific plan
      queryClient.invalidateQueries({
        queryKey: travelPlanKeys.participants(variables.planId),
      });
      // Also invalidate plan detail as participant count may change
      queryClient.invalidateQueries({
        queryKey: travelPlanKeys.detail(variables.planId),
      });
    },
  });
}

/**
 * useUpdateParticipantRole
 * Updates a participant's role in a travel plan.
 */
export function useUpdateParticipantRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      planId,
      userId,
      role,
    }: {
      planId: number | string;
      userId: number;
      role: "Admin" | "Editor" | "Viewer";
    }) => travelPlanApi.updateParticipantRole(planId, userId, role),
    onSuccess: (_data, variables) => {
      // Invalidate participants for the specific plan
      queryClient.invalidateQueries({
        queryKey: travelPlanKeys.participants(variables.planId),
      });
    },
  });
}

/**
 * useApproveParticipant
 * Approves a pending participant's join request.
 */
export function useApproveParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, userId }: { planId: number | string; userId: number }) =>
      travelPlanApi.approveParticipant(planId, userId),
    onSuccess: (_data, variables) => {
      // Invalidate participants for the specific plan
      queryClient.invalidateQueries({
        queryKey: travelPlanKeys.participants(variables.planId),
      });
      // Also invalidate plan detail as participant count may change
      queryClient.invalidateQueries({
        queryKey: travelPlanKeys.detail(variables.planId),
      });
    },
  });
}

