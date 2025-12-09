import api from "../../services/api";
import type { TravelPlan } from "../../types/travelPlan";

interface PaginatedResponse {
  data: TravelPlan[];
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  /** True when database is unavailable - response contains empty fallback data */
  dbUnavailable?: boolean;
}

/** Result from fetch_public_plans with metadata about response state */
export interface PublicPlansResult {
  plans: TravelPlan[];
  /** True when database was unavailable and empty fallback was returned */
  dbUnavailable: boolean;
}

/**
 * Fetch public travel plans.
 * Returns empty array with dbUnavailable flag when database is unreachable.
 */
export async function fetch_public_plans(): Promise<TravelPlan[]> {
  try {
    const response = await api.get<PaginatedResponse | TravelPlan[]>(
      "/travel_plan/public_plans"
    );

    // Backend returns { data: [...], pagination: {...}, dbUnavailable?: boolean }
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data &&
      Array.isArray(response.data.data)
    ) {
      // Log degraded state in development
      if ((response.data as PaginatedResponse).dbUnavailable && import.meta.env.DEV) {
        console.warn("[fetch_public_plans] Database unavailable - returned empty fallback");
      }
      return response.data.data;
    }
    // Fallback: if response is already an array, return it directly
    if (Array.isArray(response.data)) {
      return response.data;
    }
    // Default to empty array if unexpected shape
    return [];
  } catch (e) {
    // Only log in development mode
    if (import.meta.env.DEV) {
      console.error("Error fetching public plans:", e);
    }
    return [];
  }
}

/**
 * Fetch public travel plans with metadata about response state.
 * Use this when you need to display degraded state banners in UI.
 */
export async function fetch_public_plans_with_meta(): Promise<PublicPlansResult> {
  try {
    const response = await api.get<PaginatedResponse | TravelPlan[]>(
      "/travel_plan/public_plans"
    );

    // Backend returns { data: [...], pagination: {...}, dbUnavailable?: boolean }
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data &&
      Array.isArray(response.data.data)
    ) {
      const paginatedData = response.data as PaginatedResponse;
      return {
        plans: paginatedData.data,
        dbUnavailable: paginatedData.dbUnavailable ?? false,
      };
    }
    // Fallback: if response is already an array, return it directly
    if (Array.isArray(response.data)) {
      return { plans: response.data, dbUnavailable: false };
    }
    // Default to empty array if unexpected shape
    return { plans: [], dbUnavailable: false };
  } catch (e) {
    // Only log in development mode
    if (import.meta.env.DEV) {
      console.error("Error fetching public plans:", e);
    }
    // Treat errors as degraded state
    return { plans: [], dbUnavailable: true };
  }
}
