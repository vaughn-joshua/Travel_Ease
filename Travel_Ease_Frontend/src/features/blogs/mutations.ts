/**
 * Blog Mutation Hooks
 *
 * TanStack Query mutations for blog write operations.
 * All hooks use the existing blogApi from services/api.ts which handles auth automatically.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { blogApi } from "../../services/api";
import { blogKeys } from "../../lib/queryKeys";
import type { Blog } from "../../types/blog";

// ─────────────────────────────────────────────────────────────────────────────
// useCreateBlog
// Creates a new blog post.
// Invalidates lists, overview, and featured on success.
// ─────────────────────────────────────────────────────────────────────────────
export function useCreateBlog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Blog>) => blogApi.createBlog(data),
    onSuccess: () => {
      // Invalidate all blog lists so they refetch with the new blog
      queryClient.invalidateQueries({ queryKey: blogKeys.lists() });
      queryClient.invalidateQueries({ queryKey: blogKeys.overview() });
      queryClient.invalidateQueries({ queryKey: blogKeys.featured() });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// useUpdateBlog
// Updates an existing blog post.
// Invalidates the specific blog detail, lists, and overview on success.
// ─────────────────────────────────────────────────────────────────────────────
export function useUpdateBlog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Blog> }) =>
      blogApi.updateBlog(id, data),
    onSuccess: (_updatedBlog, variables) => {
      // Invalidate the specific blog detail
      // Note: If slug changed, the old cached entry will be stale but that's okay
      queryClient.invalidateQueries({ queryKey: blogKeys.details() });
      // Invalidate lists as the blog might appear differently in lists
      queryClient.invalidateQueries({ queryKey: blogKeys.lists() });
      queryClient.invalidateQueries({ queryKey: blogKeys.overview() });
      queryClient.invalidateQueries({ queryKey: blogKeys.featured() });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// useDeleteBlog
// Deletes a blog post.
// Invalidates lists, overview, and featured on success.
// ─────────────────────────────────────────────────────────────────────────────
export function useDeleteBlog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => blogApi.deleteBlog(id),
    onSuccess: () => {
      // Invalidate all blog queries since the deleted blog should be removed from all views
      queryClient.invalidateQueries({ queryKey: blogKeys.lists() });
      queryClient.invalidateQueries({ queryKey: blogKeys.overview() });
      queryClient.invalidateQueries({ queryKey: blogKeys.featured() });
      queryClient.invalidateQueries({ queryKey: blogKeys.details() });
    },
  });
}

