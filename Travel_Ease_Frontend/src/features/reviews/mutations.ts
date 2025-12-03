/**
 * Review Mutation Hooks
 *
 * TanStack Query mutations for review write operations.
 * All hooks use the reviewApi from services/api.ts which handles auth automatically.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reviewApi } from "../../services/api";
import { reviewKeys, businessKeys } from "../../lib/queryKeys";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface CreateReviewPayload {
  rating?: number;
  content?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// useCreateBusinessReview
// Creates a new review for a business.
// Invalidates the business reviews query on success.
// ─────────────────────────────────────────────────────────────────────────────
export function useCreateBusinessReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      businessId,
      data,
    }: {
      businessId: number;
      data: CreateReviewPayload;
    }) => reviewApi.createBusinessReview(businessId, data),
    onSuccess: (_data, variables) => {
      // Invalidate reviews for the specific business
      queryClient.invalidateQueries({
        queryKey: businessKeys.reviews(variables.businessId),
      });
      // Also invalidate business detail as rating may have changed
      queryClient.invalidateQueries({
        queryKey: businessKeys.detail(variables.businessId),
      });
      // Invalidate travel spots as ratings are shown there
      queryClient.invalidateQueries({
        queryKey: businessKeys.travelSpots(),
      });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// useCreateTravelPlanReview
// Creates a new review for a travel plan.
// Invalidates the travel plan reviews query on success.
// ─────────────────────────────────────────────────────────────────────────────
export function useCreateTravelPlanReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      travelPlanId,
      data,
    }: {
      travelPlanId: number;
      data: CreateReviewPayload;
    }) => reviewApi.createTravelPlanReview(travelPlanId, data),
    onSuccess: (_data, variables) => {
      // Invalidate reviews for the specific travel plan
      queryClient.invalidateQueries({
        queryKey: reviewKeys.travelPlan(variables.travelPlanId),
      });
    },
  });
}
