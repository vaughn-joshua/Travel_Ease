/**
 * TanStack Query Client Configuration
 *
 * Central QueryClient instance with sensible defaults for TravelEase.
 * Import this in main.tsx and wrap the app with QueryClientProvider.
 * 
 * Global error handling:
 * - Auth errors (401/403/419) trigger page reload via handleAuthRecovery
 * - Network errors (ECONNREFUSED, ERR_NETWORK) are NOT treated as auth errors
 * - This allows Supabase to refresh tokens automatically
 * - Only explicit logout clears auth state
 */

import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";
import { handleAuthRecovery, isAuthError, isNetworkError } from "./authRecovery";

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      // Global error handler for all queries
      // Skip network errors - server is unreachable, not an auth problem
      if (isNetworkError(error)) {
        return;
      }
      // Auth errors trigger page reload to restore session
      if (isAuthError(error)) {
        handleAuthRecovery(error);
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      // Global error handler for all mutations
      // Skip network errors - server is unreachable, not an auth problem
      if (isNetworkError(error)) {
        return;
      }
      // Auth errors trigger page reload to restore session
      if (isAuthError(error)) {
        handleAuthRecovery(error);
      }
    },
  }),
  defaultOptions: {
    queries: {
      // Data remains fresh for 30 seconds before becoming stale
      staleTime: 1000 * 30,
      // Keep unused/inactive query data in cache for 5 minutes
      gcTime: 1000 * 60 * 5,
      // Retry failed requests up to 2 times with exponential backoff
      // But don't retry auth errors or network errors (they won't succeed)
      retry: (failureCount, error) => {
        if (isAuthError(error)) return false;
        if (isNetworkError(error)) return false;
        return failureCount < 2;
      },
      // Refetch on window focus in production only (less noisy during dev)
      refetchOnWindowFocus: import.meta.env.PROD,
      // Don't refetch on mount if data is still fresh
      refetchOnMount: true,
    },
    mutations: {
      // No automatic retries for mutations - let the UI handle errors
      retry: false,
    },
  },
});
