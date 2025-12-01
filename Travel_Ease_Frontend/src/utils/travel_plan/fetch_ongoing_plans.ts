import { endpoints } from "../../config/api";
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

export async function fetch_ongoing_plans(): Promise<TravelPlan[]> {
  // Skip API call if not authenticated
  const token = localStorage.getItem("token");
  if (!token) {
    return [];
  }

  try {
    const result = await fetch(endpoints.travelPlan.ongoing, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    // 401 is expected when not authenticated - return empty silently
    if (result.status === 401) {
      return [];
    }

    if (!result.ok) {
      throw new Error(`Failed to fetch ongoing plans: ${result.status}`);
    }

    const response: PaginatedResponse = await result.json();
    // Backend returns normalized DTOs in data array
    return response.data;
  } catch (e) {
    console.error("Error fetching ongoing plans:", e);
    return [];
  }
}

