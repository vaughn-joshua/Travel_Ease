/**
 * Favorites Query Hook
 *
 * TanStack Query hook to fetch the current user's favorites.
 */

import { useQuery } from "@tanstack/react-query";
import { userApi } from "../../services/api";
import { userKeys } from "../../lib/queryKeys";

// Mirror the response type from api.ts
interface FavoritesResponse {
  business_favorites: Array<{
    favorite_id: number;
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

/**
 * useFavorites
 * Fetches the current user's business and travel plan favorites.
 * Pass `enabled: false` to disable the query (e.g., when user is not logged in).
 */
export function useFavorites(enabled = true) {
  return useQuery<FavoritesResponse, Error>({
    queryKey: userKeys.favorites(),
    queryFn: () => userApi.getFavorites("me"),
    enabled,
    staleTime: 1000 * 30,
  });
}

