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
 */

import { useQuery } from "@tanstack/react-query";
import { travelPlanKeys } from "../../lib/queryKeys";
import { travelPlanApi } from "../../services/travelPlanApi";
import { useAuth } from "../../context/AuthContext";
import { fetch_ongoing_plans } from "../../utils/travel_plan/fetch_ongoing_plans";
import { fetch_previous_plans, fetch_previous_plans_with_meta, type PreviousPlansResult } from "../../utils/travel_plan/fetch_previous_plans";
import { fetch_public_plans, fetch_public_plans_with_meta, type PublicPlansResult } from "../../utils/travel_plan/fetch_public_plans";
import { fetch_plans } from "../../utils/travel_plan/fetch_plans";
import { fetch_plan_id } from "../../utils/travel_plan/fetch_plan_id";
import { fetch_activities } from "../../utils/travel_plan/fetch_activities";
import { fetch_participants } from "../../utils/travel_plan/fetch_participants";
import type { TravelPlan, Activity } from "../../types/travelPlan";
import type { Participant } from "../../utils/travel_plan/fetch_participants";

// User role response type
interface UserRoleResponse {
  isOwner: boolean;
  role: "Admin" | "Editor" | "Viewer" | null;
  isParticipant: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// useOngoingPlans
// Fetches the current user's ongoing (active) travel plans.
// Requires authentication; returns empty array if not logged in.
// ─────────────────────────────────────────────────────────────────────────────
export function useOngoingPlans(enabled = true) {
  // Use AuthContext to ensure we only fetch when user is authenticated
  // This prevents race conditions where stale localStorage tokens cause 403s
  const { user, loading: authLoading } = useAuth();
  const isAuthenticated = !authLoading && Boolean(user);
  
  return useQuery<TravelPlan[], Error>({
    queryKey: travelPlanKeys.ongoing(),
    queryFn: fetch_ongoing_plans,
    enabled: enabled && isAuthenticated,
    // Ongoing plans can change frequently; keep default staleTime
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// usePreviousPlans
// Fetches the current user's completed/past travel plans.
// ─────────────────────────────────────────────────────────────────────────────
export function usePreviousPlans(enabled = true) {
  // Use AuthContext to ensure we only fetch when user is authenticated
  const { user, loading: authLoading } = useAuth();
  const isAuthenticated = !authLoading && Boolean(user);
  
  return useQuery<TravelPlan[], Error>({
    queryKey: travelPlanKeys.previous(),
    queryFn: fetch_previous_plans,
    enabled: enabled && isAuthenticated,
    staleTime: 1000 * 60, // Previous plans don't change often
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// usePreviousPlansWithMeta
// Fetches the current user's completed/past travel plans with degraded state metadata.
// Use this when you need to display a banner when database is unavailable.
// ─────────────────────────────────────────────────────────────────────────────
export function usePreviousPlansWithMeta(enabled = true) {
  // Use AuthContext to ensure we only fetch when user is authenticated
  const { user, loading: authLoading } = useAuth();
  const isAuthenticated = !authLoading && Boolean(user);
  
  return useQuery<PreviousPlansResult, Error>({
    queryKey: [...travelPlanKeys.previous(), 'meta'],
    queryFn: fetch_previous_plans_with_meta,
    enabled: enabled && isAuthenticated,
    staleTime: 1000 * 60,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// useUpcomingPlans
// Fetches the current user's upcoming/draft travel plans.
// ─────────────────────────────────────────────────────────────────────────────
export function useUpcomingPlans(enabled = true) {
  // Use AuthContext to ensure we only fetch when user is authenticated
  const { user, loading: authLoading } = useAuth();
  const isAuthenticated = !authLoading && Boolean(user);
  
  return useQuery<TravelPlan[], Error>({
    queryKey: travelPlanKeys.list({ status: "upcoming" }),
    queryFn: fetch_plans,
    enabled: enabled && isAuthenticated,
  });
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

