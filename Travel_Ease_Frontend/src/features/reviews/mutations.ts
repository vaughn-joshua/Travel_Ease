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

// ─────────────────────────────────────────────────────────────────────────────
// useUpdateBusinessReview
// Updates an existing business review.
// Invalidates the business reviews query on success.
// ─────────────────────────────────────────────────────────────────────────────
export function useUpdateBusinessReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reviewId,
      businessId,
      data,
    }: {
      reviewId: number;
      businessId: number;
      data: CreateReviewPayload;
    }) => reviewApi.updateBusinessReview(reviewId, data),
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
// useDeleteBusinessReview
// Deletes a business review.
// Invalidates the business reviews query on success.
// ─────────────────────────────────────────────────────────────────────────────
export function useDeleteBusinessReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reviewId,
    }: {
      reviewId: number;
      businessId: number;
    }) => reviewApi.deleteBusinessReview(reviewId),
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
// useUpdateTravelPlanReview
// Updates an existing travel plan review.
// Invalidates the travel plan reviews query on success.
// ─────────────────────────────────────────────────────────────────────────────
export function useUpdateTravelPlanReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reviewId,
      data,
    }: {
      reviewId: number;
      travelPlanId: number;
      data: CreateReviewPayload;
    }) => reviewApi.updateTravelPlanReview(reviewId, data),
    onSuccess: (_data, variables) => {
      // Invalidate reviews for the specific travel plan
      queryClient.invalidateQueries({
        queryKey: reviewKeys.travelPlan(variables.travelPlanId),
      });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// useDeleteTravelPlanReview
// Deletes a travel plan review.
// Invalidates the travel plan reviews query on success.
// ─────────────────────────────────────────────────────────────────────────────
export function useDeleteTravelPlanReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reviewId,
    }: {
      reviewId: number;
      travelPlanId: number;
    }) => reviewApi.deleteTravelPlanReview(reviewId),
    onSuccess: (_data, variables) => {
      // Invalidate reviews for the specific travel plan
      queryClient.invalidateQueries({
        queryKey: reviewKeys.travelPlan(variables.travelPlanId),
      });
    },
  });
}
