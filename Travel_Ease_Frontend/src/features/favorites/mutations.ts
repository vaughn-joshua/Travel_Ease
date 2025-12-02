/**
 * Favorites Mutation Hooks
 *
 * TanStack Query mutations for adding/removing favorites.
 * Includes cache invalidation to keep favorites list in sync.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi } from "../../services/api";
import { userKeys, businessKeys, travelPlanKeys } from "../../lib/queryKeys";

// ─────────────────────────────────────────────────────────────────────────────
// useAddFavorite
// Adds a business or travel plan to the user's favorites.
// ─────────────────────────────────────────────────────────────────────────────
interface AddFavoriteVariables {
  business_id?: number;
  travel_plan_id?: number;
}

export function useAddFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: AddFavoriteVariables) =>
      userApi.addFavorite(variables),
    onSuccess: (_data, variables) => {
      // Invalidate the favorites list so it refetches
      queryClient.invalidateQueries({ queryKey: userKeys.favorites() });

      // Optionally invalidate the detail query for the favorited item
      // so any "isFavorited" state in the detail view updates
      if (variables.business_id) {
        queryClient.invalidateQueries({
          queryKey: businessKeys.detail(variables.business_id),
        });
      }
      if (variables.travel_plan_id) {
        queryClient.invalidateQueries({
          queryKey: travelPlanKeys.detail(variables.travel_plan_id),
        });
      }
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// useRemoveFavorite
// Removes a business or travel plan from the user's favorites.
// Supports optimistic updates for a snappier UX.
// ─────────────────────────────────────────────────────────────────────────────
interface RemoveFavoriteVariables {
  business_id?: number;
  travel_plan_id?: number;
}

interface FavoritesResponse {
  business_favorites: Array<{
    favorite_id: number;
    business_id?: number;
    business: {
      business_id: number;
      name: string;
      description: string | null;
      picture: string | null;
      rating: number | null;
      city: string | null;
    } | null;
  }>;
  travel_plan_favorites: Array<{
    favorite_id: number;
    travel_plan_id?: number;
    travel_plan: {
      travel_plan_id: number;
      name: string;
      description: string | null;
      start_date: string | null;
      end_date: string | null;
      location: string | null;
    } | null;
  }>;
}

export function useRemoveFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: RemoveFavoriteVariables) =>
      userApi.removeFavorite(variables),

    // Optimistic update: immediately remove from cache before server responds
    onMutate: async (variables) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: userKeys.favorites() });

      // Snapshot previous value
      const previousFavorites = queryClient.getQueryData<FavoritesResponse>(
        userKeys.favorites()
      );

      // Optimistically update the cache
      if (previousFavorites) {
        queryClient.setQueryData<FavoritesResponse>(userKeys.favorites(), {
          ...previousFavorites,
          business_favorites: variables.business_id
            ? previousFavorites.business_favorites.filter(
                (f) =>
                  f.business?.business_id !== variables.business_id
              )
            : previousFavorites.business_favorites,
          travel_plan_favorites: variables.travel_plan_id
            ? previousFavorites.travel_plan_favorites.filter(
                (f) =>
                  f.travel_plan?.travel_plan_id !== variables.travel_plan_id
              )
            : previousFavorites.travel_plan_favorites,
        });
      }

      // Return context with the snapshotted value
      return { previousFavorites };
    },

    // If mutation fails, roll back to the previous value
    onError: (_err, _variables, context) => {
      if (context?.previousFavorites) {
        queryClient.setQueryData(
          userKeys.favorites(),
          context.previousFavorites
        );
      }
    },

    // Always refetch after error or success to ensure server state is in sync
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.favorites() });

      // Also invalidate detail queries
      if (variables.business_id) {
        queryClient.invalidateQueries({
          queryKey: businessKeys.detail(variables.business_id),
        });
      }
      if (variables.travel_plan_id) {
        queryClient.invalidateQueries({
          queryKey: travelPlanKeys.detail(variables.travel_plan_id),
        });
      }
    },
  });
}

