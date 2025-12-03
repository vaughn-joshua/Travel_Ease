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
}

export async function fetch_public_plans(): Promise<TravelPlan[]> {
  try {
    const response = await api.get<PaginatedResponse | TravelPlan[]>(
      "/travel_plan/public_plans"
    );

    // Backend returns { data: [...], pagination: {...} }
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data &&
      Array.isArray(response.data.data)
    ) {
      return response.data.data;
    }
    // Fallback: if response is already an array, return it directly
    if (Array.isArray(response.data)) {
      return response.data;
    }
    // Default to empty array if unexpected shape
    return [];
  } catch (e) {
    console.error("Error fetching public plans:", e);
    return [];
  }
}
