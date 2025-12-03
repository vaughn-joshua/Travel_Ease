/**
 * User Mutation Hooks
 *
 * TanStack Query mutations for user account operations.
 * Note: Profile updates are handled via AuthContext to maintain
 * sync with global auth state and localStorage.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../../services/auth";
import { userKeys } from "../../lib/queryKeys";

// ─────────────────────────────────────────────────────────────────────────────
// useDeleteAccount
// Permanently deletes the user's account.
// Clears all user-related cache on success.
// The component calling this should handle sign-out after success.
// ─────────────────────────────────────────────────────────────────────────────
export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.deleteAccount(),
    onSuccess: () => {
      // Clear all user-related queries from cache
      queryClient.removeQueries({ queryKey: userKeys.all });
    },
  });
}

