/**
 * Business Query Hooks
 *
 * TanStack Query hooks for business-related read operations.
 * All hooks reuse the existing businessApi from services/api.ts.
 */

import { useQuery } from "@tanstack/react-query";
import { businessApi } from "../../services/api";
import { businessKeys, type BusinessListParams } from "../../lib/queryKeys";

// Re-export types from api.ts for convenience (they're not exported there, so we mirror the shapes)
interface Business {
  id: number;
  name: string;
  description: string | null;
  categories: { id: number; name: string }[];
  hours: Record<string, { open: string | null; close: string | null }>;
  priceRange: { min: number; max: number } | null;
  media: { cover: string | null; gallery: string[] };
  menuItems: MenuItem[];
  reviews: Review[];
  reviewCount: number;
  location: {
    lat: number | null;
    lng: number | null;
    address: string;
  };
  rating: number | null;
  owner: { id: number; name: string; email: string } | null;
}

interface MenuItem {
  id: number;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  category: string | null;
  isAvailable: boolean;
}

interface Review {
  id: number;
  rating: number | null;
  content: string | null;
  date: string;
  user: { id: number; name: string } | null;
}

interface BusinessListResponse {
  items: Business[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface TravelSpotsResponse {
  message: string;
  data: Array<{
    business_id: number;
    user_id: number | null;
    name: string;
    house_number: string | null;
    street: string | null;
    brgy: string | null;
    city: string | null;
    latitude: number | null;
    longtitude: number | null;
    description: string | null;
    rating: number | null;
    status: boolean | null;
    picture: string | null;
    reviewCount: number;
  }>;
  fromCache?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// useBusinessList
// Fetches paginated/filtered list of businesses.
// ─────────────────────────────────────────────────────────────────────────────
export function useBusinessList(params?: BusinessListParams) {
  return useQuery<BusinessListResponse, Error>({
    queryKey: businessKeys.list(params),
    queryFn: () => businessApi.getBusinesses(params),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// useTravelSpots
// Fetches travel spots with optional search/city/limit (public, cached on backend).
// ─────────────────────────────────────────────────────────────────────────────
export function useTravelSpots(params?: {
  search?: string;
  city?: string;
  limit?: number;
}) {
  return useQuery<TravelSpotsResponse, Error>({
    queryKey: businessKeys.travelSpots(params),
    queryFn: ({ signal }) => businessApi.getTravelSpots(params, signal),
    staleTime: 1000 * 60, // Backend caches this; keep client fresh for 60s
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// useBusinessDetail
// Fetches a single business by ID.
// ─────────────────────────────────────────────────────────────────────────────
export function useBusinessDetail(id: string | number | undefined) {
  return useQuery<Business, Error>({
    queryKey: businessKeys.detail(id ?? ""),
    queryFn: () => businessApi.getBusiness(id!),
    enabled: id !== undefined && id !== "",
    staleTime: 1000 * 60,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// useBusinessCategories
// Fetches available categories for filter dropdowns.
// ─────────────────────────────────────────────────────────────────────────────
export function useBusinessCategories() {
  return useQuery<{ categories: string[] }, Error>({
    queryKey: businessKeys.categories(),
    queryFn: () => businessApi.getCategories(),
    staleTime: 1000 * 60 * 5, // Categories rarely change
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// useBusinessMenu
// Fetches menu items for a business.
// ─────────────────────────────────────────────────────────────────────────────
export function useBusinessMenu(businessId: string | number | undefined) {
  return useQuery<{ items: MenuItem[]; total: number }, Error>({
    queryKey: businessKeys.menu(businessId ?? ""),
    queryFn: () => businessApi.getMenuItems(businessId!),
    enabled: businessId !== undefined && businessId !== "",
    staleTime: 1000 * 60,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// useBusinessCategoriesById
// Fetches categories for a specific business by ID.
// ─────────────────────────────────────────────────────────────────────────────
interface BusinessCategory {
  category_id: number;
  category_name: string;
}

export function useBusinessCategoriesById(businessId: string | number | undefined) {
  return useQuery<BusinessCategory[], Error>({
    queryKey: [...businessKeys.detail(businessId ?? ""), "categories"],
    queryFn: () => businessApi.getCategoriesById(businessId!),
    enabled: businessId !== undefined && businessId !== "",
    staleTime: 1000 * 60,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// useMyBusinesses
// Fetches the current user's own businesses (requires auth).
// Includes retry logic that stops on auth failures (403) or DB unavailable (503).
// ─────────────────────────────────────────────────────────────────────────────
interface MyBusiness {
  business_id: number;
  name: string;
  description: string;
  city: string;
  rating: number | null;
  status: boolean;
  picture: string | null;
  categories?: { category_name: string }[];
}

interface MyBusinessesResponse {
  data: MyBusiness[];
  dbUnavailable?: boolean;
}

export function useMyBusinesses() {
  // Check both token and user profile exist (more robust than just token)
  const hasToken = !!localStorage.getItem("token");
  const hasUserProfile = !!localStorage.getItem("travelEaseUser");
  const isAuthenticated = hasToken && hasUserProfile;
  
  return useQuery<MyBusinessesResponse, Error>({
    queryKey: [...businessKeys.lists(), "my"],
    queryFn: async () => {
      try {
        return await businessApi.getMyBusinesses();
      } catch (error) {
        // Check if this is a DB unavailable error - return empty with flag
        const axiosError = error as { response?: { status?: number; data?: { code?: string } } };
        if (axiosError.response?.status === 503 && axiosError.response?.data?.code === "DB_UNAVAILABLE") {
          return { data: [], dbUnavailable: true };
        }
        throw error;
      }
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 30,
    // Don't retry on auth failures or DB unavailable
    retry: (failureCount, error) => {
      const axiosError = error as { response?: { status?: number; data?: { code?: string } } };
      const status = axiosError.response?.status;
      const code = axiosError.response?.data?.code;
      
      // Don't retry on 401, 403, or 503 with DB_UNAVAILABLE
      if (status === 401 || status === 403) return false;
      if (status === 503 && code === "DB_UNAVAILABLE") return false;
      
      // Retry other errors up to 2 times
      return failureCount < 2;
    },
  });
}

