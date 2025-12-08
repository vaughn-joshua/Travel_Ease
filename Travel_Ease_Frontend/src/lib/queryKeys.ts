/**
 * Query Key Factory
 *
 * Centralised query key builders for TanStack Query.
 * Using factory functions keeps keys consistent, type-safe, and easy to invalidate.
 *
 * Pattern:
 *   - `all`   → base key for the entire domain (useful for broad invalidation)
 *   - `lists` → all list-type queries
 *   - `list(params)` → a specific filtered/paginated list
 *   - `details` → all detail queries
 *   - `detail(id)` → single resource by identifier
 *
 * Example usage:
 *   queryClient.invalidateQueries({ queryKey: blogKeys.all })
 *   useQuery({ queryKey: blogKeys.detail(slug), ... })
 */

import type { BlogQueryParams } from "../types/blog";

// ─────────────────────────────────────────────────────────────────────────────
// Blog keys
// ─────────────────────────────────────────────────────────────────────────────
export const blogKeys = {
  all: ["blogs"] as const,
  lists: () => [...blogKeys.all, "list"] as const,
  list: (params?: BlogQueryParams) => [...blogKeys.lists(), params] as const,
  overview: () => [...blogKeys.all, "overview"] as const,
  featured: () => [...blogKeys.all, "featured"] as const,
  details: () => [...blogKeys.all, "detail"] as const,
  detail: (slug: string) => [...blogKeys.details(), slug] as const,
};

// ─────────────────────────────────────────────────────────────────────────────
// Travel Plan keys
// ─────────────────────────────────────────────────────────────────────────────
export interface TravelPlanListParams {
  page?: number;
  pageSize?: number;
  status?: string;
}

export const travelPlanKeys = {
  all: ["travel-plans"] as const,
  lists: () => [...travelPlanKeys.all, "list"] as const,
  list: (params?: TravelPlanListParams) =>
    [...travelPlanKeys.lists(), params] as const,
  ongoing: () => [...travelPlanKeys.all, "ongoing"] as const,
  previous: () => [...travelPlanKeys.all, "previous"] as const,
  public: () => [...travelPlanKeys.all, "public"] as const,
  details: () => [...travelPlanKeys.all, "detail"] as const,
  detail: (id: number | string) => [...travelPlanKeys.details(), id] as const,
  activities: (planId: number | string) =>
    [...travelPlanKeys.detail(planId), "activities"] as const,
  participants: (planId: number | string) =>
    [...travelPlanKeys.detail(planId), "participants"] as const,
};

// ─────────────────────────────────────────────────────────────────────────────
// Business keys
// ─────────────────────────────────────────────────────────────────────────────
export interface BusinessListParams {
  page?: number;
  pageSize?: number;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

export const businessKeys = {
  all: ["businesses"] as const,
  lists: () => [...businessKeys.all, "list"] as const,
  list: (params?: BusinessListParams) =>
    [...businessKeys.lists(), params] as const,
  travelSpots: (params?: { search?: string; city?: string; category?: string; limit?: number }) =>
    [...businessKeys.all, "travel-spots", params] as const,
  categories: () => [...businessKeys.all, "categories"] as const,
  details: () => [...businessKeys.all, "detail"] as const,
  detail: (id: number | string) => [...businessKeys.details(), id] as const,
  menu: (businessId: number | string) =>
    [...businessKeys.detail(businessId), "menu"] as const,
  reviews: (businessId: number | string) =>
    [...businessKeys.detail(businessId), "reviews"] as const,
};

// ─────────────────────────────────────────────────────────────────────────────
// User / Auth-dependent keys
// ─────────────────────────────────────────────────────────────────────────────
export const userKeys = {
  all: ["user"] as const,
  profile: () => [...userKeys.all, "profile"] as const,
  favorites: () => [...userKeys.all, "favorites"] as const,
};

// ─────────────────────────────────────────────────────────────────────────────
// Map / Geocoding keys (for external Nominatim API caching)
// ─────────────────────────────────────────────────────────────────────────────
export const mapKeys = {
  all: ["map"] as const,
  search: (query: string) => [...mapKeys.all, "search", query] as const,
  geocode: (address: string) => [...mapKeys.all, "geocode", address] as const,
  reverse: (lat: number, lng: number) =>
    [...mapKeys.all, "reverse", lat, lng] as const,
};

// ─────────────────────────────────────────────────────────────────────────────
// Review keys
// ─────────────────────────────────────────────────────────────────────────────
export const reviewKeys = {
  all: ["reviews"] as const,
  business: (businessId: number | string) =>
    [...reviewKeys.all, "business", businessId] as const,
  travelPlan: (travelPlanId: number | string) =>
    [...reviewKeys.all, "travel-plan", travelPlanId] as const,
};
