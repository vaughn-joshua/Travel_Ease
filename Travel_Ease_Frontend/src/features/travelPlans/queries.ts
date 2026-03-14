/**
 * Travel Plan Query Hooks
 *
 * TanStack Query hooks for travel plan read operations.
 * Reuses existing utility functions under utils/travel_plan which handle auth headers.
 * 
 * Degraded Mode Support:
 * - Some hooks (usePublicPlansWithMeta, usePreviousPlansWithMeta) return dbUnavailable flag
 * - Use these when you need to display degraded state banners in UI
 * 
 * Auth-Protected Queries:
 * - Queries that require authentication (ongoing, previous, upcoming) use useAuth()
 *   to check loading and user state before enabling
 * - This prevents race conditions where queries fire before auth state is resolved
 * 
 * Grouped Plans:
 * - useGroupedPlans() fetches all plans in a single request (ongoing, upcoming, previous)
 * - useOngoingPlans, useUpcomingPlans, usePreviousPlans derive from the grouped query
 * - This reduces network requests from 3 to 1 for better performance
 */

import { useQuery } from "@tanstack/react-query";
import { travelPlanKeys } from "../../lib/queryKeys";
import { travelPlanApi } from "../../services/travelPlanApi";
import { trafficApi } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { fetch_grouped_plans } from "../../utils/travel_plan/fetch_grouped_plans";
import { fetch_public_plans, fetch_public_plans_with_meta, type PublicPlansResult } from "../../utils/travel_plan/fetch_public_plans";
import { fetch_plan_id } from "../../utils/travel_plan/fetch_plan_id";
import { fetch_activities } from "../../utils/travel_plan/fetch_activities";
import { fetch_participants } from "../../utils/travel_plan/fetch_participants";
import type { TravelPlan, Activity, PlansQueryResult, GroupedPlansResult, PlanGroupData } from "../../types/travelPlan";
import type { Participant } from "../../utils/travel_plan/fetch_participants";

// User role response type
interface UserRoleResponse {
  isOwner: boolean;
  role: "Admin" | "Editor" | "Viewer" | null;
  isParticipant: boolean;
}

const EMPTY_GROUP: PlanGroupData = { data: [], total: 0 };

function getDefaultGroupedResult(): GroupedPlansResult {
  return {
    upcoming: EMPTY_GROUP,
    ongoing: EMPTY_GROUP,
    previous: EMPTY_GROUP,
    dbUnavailable: false,
  };
}

function getDefaultPlansResult(): PlansQueryResult {
  return {
    plans: [],
    pagination: {
      page: 1,
      pageSize: 0,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    },
    dbUnavailable: false,
  };
}

/**
 * Convert a PlanGroupData to PlansQueryResult for backward compatibility
 */
function groupToPlansResult(group: PlanGroupData, dbUnavailable: boolean): PlansQueryResult {
  return {
    plans: group.data,
    pagination: {
      page: 1,
      pageSize: group.total,
      total: group.total,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    },
    dbUnavailable,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// useGroupedPlans
// Fetches ALL of the user's plans in a single request, grouped by status.
// This is the base query that other hooks derive from.
// ─────────────────────────────────────────────────────────────────────────────
export function useGroupedPlans(enabled = true) {
  // Fire immediately if a localStorage token exists — don't wait for
  // Supabase auth.getSession() to resolve (saves 200-500ms on every load).
  // fetch_grouped_plans already handles missing/invalid tokens gracefully.
  const hasToken = typeof window !== "undefined" && Boolean(localStorage.getItem("token"));

  return useQuery<GroupedPlansResult, Error>({
    queryKey: travelPlanKeys.grouped(),
    queryFn: fetch_grouped_plans,
    enabled: enabled && hasToken,
    staleTime: 1000 * 30,
    placeholderData: (previousData) => previousData,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// useOngoingPlans
// Fetches the current user's ongoing (active) travel plans.
// Derives from the grouped query for efficiency.
// ─────────────────────────────────────────────────────────────────────────────
export function useOngoingPlans(enabled = true) {
  const grouped = useGroupedPlans(enabled);

  // Transform grouped data to PlansQueryResult format
  const data: PlansQueryResult = grouped.data
    ? groupToPlansResult(grouped.data.ongoing, grouped.data.dbUnavailable ?? false)
    : getDefaultPlansResult();

  return {
    ...grouped,
    data,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// usePreviousPlans
// Fetches the current user's completed/past travel plans.
// Derives from the grouped query for efficiency.
// ─────────────────────────────────────────────────────────────────────────────
export function usePreviousPlans(enabled = true) {
  const grouped = useGroupedPlans(enabled);

  const data: PlansQueryResult = grouped.data
    ? groupToPlansResult(grouped.data.previous, grouped.data.dbUnavailable ?? false)
    : getDefaultPlansResult();

  return {
    ...grouped,
    data,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// usePreviousPlansWithMeta
// Alias for usePreviousPlans (now includes dbUnavailable by default)
// ─────────────────────────────────────────────────────────────────────────────
export function usePreviousPlansWithMeta(enabled = true) {
  return usePreviousPlans(enabled);
}

// ─────────────────────────────────────────────────────────────────────────────
// useUpcomingPlans
// Fetches the current user's upcoming/draft travel plans.
// Derives from the grouped query for efficiency.
// ─────────────────────────────────────────────────────────────────────────────
export function useUpcomingPlans(enabled = true) {
  const grouped = useGroupedPlans(enabled);

  const data: PlansQueryResult = grouped.data
    ? groupToPlansResult(grouped.data.upcoming, grouped.data.dbUnavailable ?? false)
    : getDefaultPlansResult();

  return {
    ...grouped,
    data,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// usePublicPlans
// Fetches publicly visible travel plans (for discovery / quick join).
// ─────────────────────────────────────────────────────────────────────────────
export function usePublicPlans() {
  return useQuery<TravelPlan[], Error>({
    queryKey: travelPlanKeys.public(),
    queryFn: fetch_public_plans,
    staleTime: 1000 * 30,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// usePublicPlansWithMeta
// Fetches publicly visible travel plans with degraded state metadata.
// Use this when you need to display a banner when database is unavailable.
// ─────────────────────────────────────────────────────────────────────────────
export function usePublicPlansWithMeta() {
  return useQuery<PublicPlansResult, Error>({
    queryKey: [...travelPlanKeys.public(), 'meta'],
    queryFn: fetch_public_plans_with_meta,
    staleTime: 1000 * 30,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// useTravelPlanDetail
// Fetches a single travel plan by ID.
// Only enabled when we have an ID and a valid auth token.
// ─────────────────────────────────────────────────────────────────────────────
export function useTravelPlanDetail(id: number | string | undefined) {
  // Use AuthContext to ensure we only fetch when user is authenticated
  const { user, loading: authLoading } = useAuth();
  const isAuthenticated = !authLoading && Boolean(user);

  return useQuery<TravelPlan | null, Error>({
    queryKey: travelPlanKeys.detail(id ?? ""),
    queryFn: () => fetch_plan_id(id!),
    enabled: id !== undefined && id !== "" && isAuthenticated,
    staleTime: 1000 * 30,
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error.message.includes('401') || error.message.includes('Session expired')) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// useTravelPlanActivities
// Fetches activities for a given travel plan.
// ─────────────────────────────────────────────────────────────────────────────
export function useTravelPlanActivities(planId: number | string | undefined) {
  return useQuery<Activity[], Error>({
    queryKey: travelPlanKeys.activities(planId ?? ""),
    queryFn: () => fetch_activities(Number(planId)),
    enabled: planId !== undefined && planId !== "",
    staleTime: 1000 * 30,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// useTravelPlanParticipants
// Fetches participants/collaborators for a given travel plan.
// ─────────────────────────────────────────────────────────────────────────────
export function useTravelPlanParticipants(planId: number | string | undefined) {
  return useQuery<Participant[], Error>({
    queryKey: travelPlanKeys.participants(planId ?? ""),
    queryFn: () => fetch_participants(Number(planId)),
    enabled: planId !== undefined && planId !== "",
    staleTime: 1000 * 60,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// useUserPlanRole
// Fetches the current user's role for a specific plan.
// Returns: { isOwner, role, isParticipant }
// ─────────────────────────────────────────────────────────────────────────────
export function useUserPlanRole(planId: number | string | undefined) {
  // Use AuthContext to ensure we only fetch when user is authenticated
  const { user, loading: authLoading } = useAuth();
  const isAuthenticated = !authLoading && Boolean(user);

  return useQuery<UserRoleResponse, Error>({
    queryKey: ["travel-plan", "user-role", planId],
    queryFn: () => travelPlanApi.getUserRole(planId!),
    enabled: planId !== undefined && planId !== "" && isAuthenticated,
    staleTime: 1000 * 30,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// useTrafficSuggestion
// Fetches alternative activities if traffic between two activities is heavy.
// ─────────────────────────────────────────────────────────────────────────────
export function useTrafficSuggestion(
  originId: number | null | undefined,
  destId: number | undefined,
  dayGroup: string = 'weekday',
  originLat?: number,
  originLng?: number
) {
  return useQuery({
    queryKey: ["traffic-suggestion", originId, destId, dayGroup, originLat, originLng],
    queryFn: () => trafficApi.getAlternativeSuggestion(originId ?? null, destId!, dayGroup, originLat, originLng),
    enabled: (!!originId || (!!originLat && !!originLng)) && !!destId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

