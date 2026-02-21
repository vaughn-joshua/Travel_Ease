/**
 * useRSSFeed
 *
 * TanStack Query hook that fetches and caches external RSS feed data
 * via the backend proxy endpoint (GET /api/blogs/rss-feed).
 *
 * - Only fetches when feedUrl is non-empty
 * - staleTime: 5 minutes (matches backend Redis TTL)
 * - Retries once on failure, then surfaces error
 */
import { useQuery } from "@tanstack/react-query";
import { blogApi } from "../../services/api";
import type { RSSFeedResponse } from "../../types/blog";

export const rssQueryKeys = {
  feed: (url: string, limit?: number) =>
    ["rss-feed", url, limit] as const,
};

/**
 * Fetches an external RSS feed through the TravelEase backend proxy.
 * Safe to call with an empty feedUrl — the query is disabled until one is provided.
 */
export function useRSSFeed(feedUrl: string, limit = 6) {
  return useQuery<RSSFeedResponse, Error>({
    queryKey: rssQueryKeys.feed(feedUrl, limit),
    queryFn: () => blogApi.fetchRSSFeed(feedUrl, limit),
    // Only run when a URL is provided
    enabled: Boolean(feedUrl),
    // Mirror backend cache TTL (5 minutes)
    staleTime: 1000 * 60 * 5,
    // Retry once on failure
    retry: 1,
    // Don't throw on failure — let us show a soft error in UI
    throwOnError: false,
  });
}
