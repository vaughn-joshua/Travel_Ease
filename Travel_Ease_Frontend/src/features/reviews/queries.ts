/**
 * Review Query Hooks
 *
 * TanStack Query hooks for review-related read operations.
 * All hooks reuse the reviewApi from services/api.ts.
 */

import { useQuery } from "@tanstack/react-query";
import { reviewApi } from "../../services/api";
import { reviewKeys, businessKeys } from "../../lib/queryKeys";

// Mirror the response types from api.ts
interface ReviewUser {
  user_id: number;
  first_name: string;
  last_name: string;
}

interface BusinessReview {
  review_id: number;
  user_id: number;
  business_id: number;
  rating: number | null;
  content: string | null;
  review_date: string;
  user?: ReviewUser;
}

interface TravelPlanReview {
  review_id: number;
  user_id: number;
  travel_plan_id: number;
  rating: number | null;
  content: string | null;
  review_date: string;
  user?: ReviewUser;
}

// ─────────────────────────────────────────────────────────────────────────────
// useBusinessReviews
// Fetches reviews for a specific business.
// ─────────────────────────────────────────────────────────────────────────────
export function useBusinessReviews(businessId: number | string | undefined) {
  return useQuery<BusinessReview[], Error>({
    queryKey: businessKeys.reviews(businessId ?? ""),
    queryFn: async () => {
      const response = await reviewApi.getBusinessReviews(businessId!);
      // Map backend response to frontend shape
      return (response.data || []).map((r: any) => ({
        review_id: r.review_id,
        user_id: r.user_id,
        business_id: r.business_id,
        rating: r.rating ? Number(r.rating) : null,
        content: r.review_content || r.content,
        review_date: r.review_date,
        user: r.user,
      }));
    },
    enabled: businessId !== undefined && businessId !== "",
    staleTime: 1000 * 60, // 1 minute
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// useTravelPlanReviews
// Fetches reviews for a specific travel plan.
// ─────────────────────────────────────────────────────────────────────────────
export function useTravelPlanReviews(
  travelPlanId: number | string | undefined
) {
  return useQuery<TravelPlanReview[], Error>({
    queryKey: reviewKeys.travelPlan(travelPlanId ?? ""),
    queryFn: async () => {
      const response = await reviewApi.getTravelPlanReviews(travelPlanId!);
      return response.data || [];
    },
    enabled: travelPlanId !== undefined && travelPlanId !== "",
    staleTime: 1000 * 60, // 1 minute
  });
}
