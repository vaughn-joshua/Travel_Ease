import api from "../../services/api";
import type { PlansPagination, PlansQueryResult, TravelPlan } from "../../types/travelPlan";

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

const EMPTY_PAGINATION: PlansPagination = {
  page: 1,
  pageSize: 0,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
};

/**
 * Fetch previous (completed/cancelled) travel plans for authenticated user.
 * Returns empty array with dbUnavailable flag when database is unreachable.
 */
export async function fetch_previous_plans(): Promise<PlansQueryResult> {
  // Skip API call if not authenticated
  const token = localStorage.getItem("token");
  if (!token) {
    return { plans: [], pagination: EMPTY_PAGINATION, dbUnavailable: false };
  }

  try {
    const response = await api.get<PaginatedResponse>(
      "/travel_plan/previous_plans",
      {
        params: {
          page: 1,
          pageSize: 100,
        },
      }
    );
    // Log degraded state in development
    if (response.data.dbUnavailable && import.meta.env.DEV) {
      console.warn("[fetch_previous_plans] Database unavailable - returned empty fallback");
    }
    // Backend returns normalized DTOs in data array
    return {
      plans: response.data.data,
      pagination: response.data.pagination,
      dbUnavailable: Boolean(response.data.dbUnavailable),
    };
  } catch (e: any) {
    // 401/403 means token is invalid - axios interceptor will trigger page reload to restore session
    const status = e.response?.status;
    const code = e.response?.data?.code;
    const isAuthError = status === 401 || status === 403;
    const isDbUnavailable =
      status === 503 || code === "CONNECTION_ERROR" || code === "DB_UNAVAILABLE";

    if (import.meta.env.DEV && !isAuthError) {
      console.error("Error fetching previous plans:", e);
    }

    return {
      plans: [],
      pagination: EMPTY_PAGINATION,
      dbUnavailable: Boolean(isDbUnavailable),
    };
  }
}

/**
 * Fetch previous plans with metadata about response state.
 * Use this when you need to display degraded state banners in UI.
 */
export async function fetch_previous_plans_with_meta(): Promise<PlansQueryResult> {
  // Skip API call if not authenticated
  const token = localStorage.getItem("token");
  if (!token) {
    return { plans: [], pagination: EMPTY_PAGINATION, dbUnavailable: false };
  }

  try {
    const response = await api.get<PaginatedResponse>(
      "/travel_plan/previous_plans",
      {
        params: {
          page: 1,
          pageSize: 100,
        },
      }
    );
    return {
      plans: response.data.data,
      pagination: response.data.pagination,
      dbUnavailable: response.data.dbUnavailable ?? false,
    };
  } catch (e: any) {
    // 401/403 means token is invalid - axios interceptor will trigger page reload to restore session
    const status = e.response?.status;
    const code = e.response?.data?.code;
    const isAuthError = status === 401 || status === 403;
    const isDbUnavailable =
      status === 503 || code === "CONNECTION_ERROR" || code === "DB_UNAVAILABLE";

    // Only log non-auth errors in development
    if (import.meta.env.DEV && !isAuthError) {
      console.error("Error fetching previous plans:", e);
    }
    // Treat errors as degraded state
    return {
      plans: [],
      pagination: EMPTY_PAGINATION,
      dbUnavailable: isAuthError ? false : true,
    };
  }
}
