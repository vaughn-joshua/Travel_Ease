/**
 * Business Mutation Hooks
 *
 * TanStack Query mutations for business write operations.
 * All hooks use the existing businessApi from services/api.ts which handles auth automatically.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { businessApi } from "../../services/api";
import { businessKeys } from "../../lib/queryKeys";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface CreateBusinessPayload {
  name: string;
  description?: string;
  house_no?: string;
  street?: string;
  brgy?: string;
  city?: string;
  lat?: number | null;
  lng?: number | null;
  secure_url?: string;
  category?: string[];
  categoryIds?: number[];
  business_hrs?: Array<{ day: string; start?: string; end?: string }>;
  [key: string]: unknown;
}

interface UpdateBusinessPayload {
  name?: string;
  description?: string;
  house_no?: string;
  street?: string;
  brgy?: string;
  city?: string;
  lat?: number | null;
  lng?: number | null;
  secure_url?: string;
  category?: string[];
  categories?: Array<{
    category_id?: number;
    category_name: string;
    min_price?: number;
    max_price?: number;
  }>;
  business_hrs?: Array<{ day_of_week: string; open_time?: string; close_time?: string }>;
  [key: string]: unknown;
}

interface MenuItem {
  id?: number;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  category?: string | null;
  isAvailable?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// useCreateBusiness
// Creates a new business.
// Invalidates lists and travel spots on success.
// ─────────────────────────────────────────────────────────────────────────────
export function useCreateBusiness() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBusinessPayload) => businessApi.createBusiness(data),
    onSuccess: () => {
      // Invalidate business lists so they refetch with the new business
      queryClient.invalidateQueries({ queryKey: businessKeys.lists() });
      queryClient.invalidateQueries({ queryKey: businessKeys.travelSpots() });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// useUpdateBusiness
// Updates an existing business.
// Invalidates the specific business detail, lists, and travel spots on success.
// ─────────────────────────────────────────────────────────────────────────────
export function useUpdateBusiness() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: UpdateBusinessPayload }) =>
      businessApi.updateBusiness(id, data),
    onSuccess: (_, { id }) => {
      // Invalidate the specific business detail
      queryClient.invalidateQueries({ queryKey: businessKeys.detail(id) });
      // Invalidate lists as the business might appear differently
      queryClient.invalidateQueries({ queryKey: businessKeys.lists() });
      queryClient.invalidateQueries({ queryKey: businessKeys.travelSpots() });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// useCreateMenuItem
// Creates a new menu item for a business.
// Invalidates the menu query on success.
// ─────────────────────────────────────────────────────────────────────────────
export function useCreateMenuItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      businessId,
      data,
    }: {
      businessId: string | number;
      data: Partial<MenuItem>;
    }) => businessApi.createMenuItem(businessId, data),
    onSuccess: (_, { businessId }) => {
      queryClient.invalidateQueries({ queryKey: businessKeys.menu(businessId) });
      queryClient.invalidateQueries({ queryKey: businessKeys.detail(businessId) });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// useUpdateMenuItem
// Updates an existing menu item.
// Invalidates the menu query on success.
// ─────────────────────────────────────────────────────────────────────────────
export function useUpdateMenuItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      businessId,
      itemId,
      data,
    }: {
      businessId: string | number;
      itemId: number;
      data: Partial<MenuItem>;
    }) => businessApi.updateMenuItem(businessId, itemId, data),
    onSuccess: (_, { businessId }) => {
      queryClient.invalidateQueries({ queryKey: businessKeys.menu(businessId) });
      queryClient.invalidateQueries({ queryKey: businessKeys.detail(businessId) });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// useDeleteMenuItem
// Deletes a menu item.
// Invalidates the menu query on success.
// ─────────────────────────────────────────────────────────────────────────────
export function useDeleteMenuItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      businessId,
      itemId,
    }: {
      businessId: string | number;
      itemId: number;
    }) => businessApi.deleteMenuItem(businessId, itemId),
    onSuccess: (_, { businessId }) => {
      queryClient.invalidateQueries({ queryKey: businessKeys.menu(businessId) });
      queryClient.invalidateQueries({ queryKey: businessKeys.detail(businessId) });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// useCreatePriceRange
// Creates price ranges for business categories.
// Invalidates the business detail on success.
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @deprecated Price range is now stored directly on business table.
 * Use useEditBusiness with min_price/max_price instead.
 */
interface PriceRangePayload {
  id?: number;
  business_id?: string | number;
  categories?: Array<{ category_id: number; min_price: number; max_price: number }>;
}

/**
 * @deprecated Price range is now stored directly on business table.
 * Use useEditBusiness with min_price/max_price instead.
 */
export function useCreatePriceRange() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PriceRangePayload) => businessApi.createPriceRange(data),
    onSuccess: (_, { business_id }) => {
      if (business_id) {
        queryClient.invalidateQueries({ queryKey: businessKeys.detail(business_id) });
      }
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// useDeleteBusiness
// Deletes a business.
// Invalidates lists and travel spots on success.
// ─────────────────────────────────────────────────────────────────────────────
export function useDeleteBusiness() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => businessApi.deleteBusiness(id),
    onSuccess: () => {
      // Invalidate business lists so they refetch without the deleted business
      queryClient.invalidateQueries({ queryKey: businessKeys.lists() });
      queryClient.invalidateQueries({ queryKey: businessKeys.travelSpots() });
    },
  });
}

