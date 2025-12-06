import api from "../../services/api";
import type { TravelPlan } from "../../types/travelPlan";

interface PaginatedResponse {
  data: TravelPlan[];
  pagination: {
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

/** Result from fetch_previous_plans with metadata about response state */
export interface PreviousPlansResult {
  plans: TravelPlan[];
  /** True when database was unavailable and empty fallback was returned */
  dbUnavailable: boolean;
}

/**
 * Fetch previous (completed/cancelled) travel plans for authenticated user.
 * Returns empty array with dbUnavailable flag when database is unreachable.
 */
export async function fetch_previous_plans(): Promise<TravelPlan[]> {
  // Skip API call if not authenticated
  const token = localStorage.getItem("token");
  if (!token) {
    return [];
  }

  try {
    const response = await api.get<PaginatedResponse>(
      "/travel_plan/previous_plans"
    );
    // Log degraded state in development
    if (response.data.dbUnavailable && import.meta.env.DEV) {
      console.warn("[fetch_previous_plans] Database unavailable - returned empty fallback");
    }
    // Backend returns normalized DTOs in data array
    return response.data.data;
  } catch (e: any) {
    // 401/403 means token is invalid - axios interceptor will handle clearing auth
    if (e.response?.status === 401 || e.response?.status === 403) {
      return [];
    }
    // Only log non-auth errors in development
    if (import.meta.env.DEV) {
      console.error("Error fetching previous plans:", e);
    }
    return [];
  }
}

/**
 * Fetch previous plans with metadata about response state.
 * Use this when you need to display degraded state banners in UI.
 */
export async function fetch_previous_plans_with_meta(): Promise<PreviousPlansResult> {
  // Skip API call if not authenticated
  const token = localStorage.getItem("token");
  if (!token) {
    return { plans: [], dbUnavailable: false };
  }

  try {
    const response = await api.get<PaginatedResponse>(
      "/travel_plan/previous_plans"
    );
    return {
      plans: response.data.data,
      dbUnavailable: response.data.dbUnavailable ?? false,
    };
  } catch (e: any) {
    // 401/403 means token is invalid - axios interceptor will handle clearing auth
    if (e.response?.status === 401 || e.response?.status === 403) {
      return { plans: [], dbUnavailable: false };
    }
    // Only log non-auth errors in development
    if (import.meta.env.DEV) {
      console.error("Error fetching previous plans:", e);
    }
    // Treat errors as degraded state
    return { plans: [], dbUnavailable: true };
  }
}
