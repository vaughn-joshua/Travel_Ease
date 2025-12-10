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

export async function fetch_plans(): Promise<PlansQueryResult> {
  // Skip API call if not authenticated
  const token = localStorage.getItem("token");
  if (!token) {
    return { plans: [], pagination: EMPTY_PAGINATION, dbUnavailable: false };
  }

  try {
    const response = await api.get<PaginatedResponse>("/travel_plan/plans", {
      params: {
        page: 1,
        pageSize: 100,
      },
    });
    // Backend returns normalized DTOs in data array
    return {
      plans: response.data.data,
      pagination: response.data.pagination,
      dbUnavailable: Boolean(response.data.dbUnavailable),
    };
  } catch (e: any) {
    const status = e.response?.status;
    const code = e.response?.data?.code;
    const isAuthError = status === 401 || status === 403;
    const isDbUnavailable =
      status === 503 || code === "CONNECTION_ERROR" || code === "DB_UNAVAILABLE";

    if (import.meta.env.DEV && !isAuthError) {
      console.error("Error fetching plans:", e);
    }

    return {
      plans: [],
      pagination: EMPTY_PAGINATION,
      dbUnavailable: Boolean(isDbUnavailable),
    };
  }
}