/**
 * TanStack Query Client Configuration
 *
 * Central QueryClient instance with sensible defaults for TravelEase.
 * Import this in main.tsx and wrap the app with QueryClientProvider.
 */

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data remains fresh for 30 seconds before becoming stale
      staleTime: 1000 * 30,
      // Keep unused/inactive query data in cache for 5 minutes
      gcTime: 1000 * 60 * 5,
      // Retry failed requests up to 2 times with exponential backoff
      retry: 2,
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

