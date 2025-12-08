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
}

export async function fetch_plans(): Promise<TravelPlan[]> {
  // Skip API call if not authenticated
  const token = localStorage.getItem("token");
  if (!token) {
    return [];
  }

  try {
    const response = await api.get<PaginatedResponse>("/travel_plan/plans");
    // Backend returns normalized DTOs in data array
    return response.data.data;
  } catch (e: any) {
    // 401/403 means token is invalid - axios interceptor will trigger page reload to restore session
    if (e.response?.status === 401 || e.response?.status === 403) {
      return [];
    }
    // Only log non-auth errors in development
    if (import.meta.env.DEV) {
      console.error("Error fetching plans:", e);
    }
    return [];
  }
}
