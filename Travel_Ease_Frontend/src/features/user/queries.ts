/**
 * User Query Hooks
 *
 * TanStack Query hooks for user read operations.
 * Note: Profile data is primarily managed via AuthContext.
 * These hooks are for user searches and other read operations.
 */

import { useQuery } from "@tanstack/react-query";
import api from "../../services/api";
import { userKeys } from "../../lib/queryKeys";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface UserSearchResult {
  user_id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// useUserSearch
// Search users by email (for adding collaborators to travel plans)
// ─────────────────────────────────────────────────────────────────────────────
export function useUserSearch(query: string, enabled = true) {
  return useQuery<UserSearchResult[], Error>({
    queryKey: [...userKeys.all, "search", query],
    queryFn: async () => {
      if (!query || query.length < 2) {
        return [];
      }
      const response = await api.get<UserSearchResult[]>("/user/search", {
        params: { q: query },
      });
      return response.data;
    },
    enabled: enabled && query.length >= 2,
    staleTime: 1000 * 30, // 30 seconds
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// useUserById
// Fetch a specific user's public profile
// ─────────────────────────────────────────────────────────────────────────────
export function useUserById(userId: number | string | undefined) {
  return useQuery({
    queryKey: [...userKeys.all, "profile", userId],
    queryFn: async () => {
      const response = await api.get(`/user/user/${userId}`);
      return response.data;
    },
    enabled: userId !== undefined,
    staleTime: 1000 * 60, // 1 minute
  });
}

