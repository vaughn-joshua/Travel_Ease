/**
 * Blog Query Hooks
 *
 * TanStack Query hooks for blog-related read operations.
 * All hooks reuse the existing blogApi from services/api.ts.
 */

import { useQuery } from "@tanstack/react-query";
import { blogApi } from "../../services/api";
import { blogKeys } from "../../lib/queryKeys";
import type { Blog, BlogOverviewResponse, BlogQueryParams, BlogListResponse } from "../../types/blog";

// ─────────────────────────────────────────────────────────────────────────────
// useBlogOverview
// Fetches aggregated overview (featured + category slices) in one call.
// ─────────────────────────────────────────────────────────────────────────────
export function useBlogOverview() {
  return useQuery<BlogOverviewResponse, Error>({
    queryKey: blogKeys.overview(),
    queryFn: ({ signal }) => blogApi.getOverview(signal),
    // Overview data changes infrequently; keep it fresh for 60s
    staleTime: 1000 * 60,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// useFeaturedBlogs
// Fetches only the featured blogs array.
// ─────────────────────────────────────────────────────────────────────────────
export function useFeaturedBlogs() {
  return useQuery<Blog[], Error>({
    queryKey: blogKeys.featured(),
    queryFn: () => blogApi.getFeaturedBlogs(),
    staleTime: 1000 * 60,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// useBlogList
// Fetches a paginated/filtered list of blogs.
// ─────────────────────────────────────────────────────────────────────────────
export function useBlogList(params?: BlogQueryParams) {
  return useQuery<BlogListResponse, Error>({
    queryKey: blogKeys.list(params),
    queryFn: () => blogApi.getBlogs(params),
    // Lists can change more often; use default staleTime
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// useBlogDetail
// Fetches a single blog by slug.
// ─────────────────────────────────────────────────────────────────────────────
export function useBlogDetail(slug: string | undefined) {
  return useQuery<Blog, Error>({
    queryKey: blogKeys.detail(slug ?? ""),
    queryFn: () => blogApi.getBlogBySlug(slug!),
    // Only run query when slug is provided
    enabled: Boolean(slug),
    staleTime: 1000 * 60,
  });
}

