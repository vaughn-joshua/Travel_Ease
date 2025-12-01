import { endpoints } from "../../config/api";
import type { TravelPlan } from "../../types/travelPlan";

interface PaginatedResponse {
  data?: TravelPlan[];
  items?: TravelPlan[];
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export async function fetch_previous_plans(): Promise<TravelPlan[]> {
  // Skip API call if not authenticated
  const token = localStorage.getItem("token");
  if (!token) {
    return [];
  }

  try {
    const result = await fetch(endpoints.travelPlan.previous, {
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
      throw new Error(`Failed to fetch previous plans: ${result.status}`);
    }

    const response: PaginatedResponse = await result.json();
    // Backend returns paginated response with data or items array
    return response.data || response.items || [];
  } catch (e) {
    console.error("Error fetching previous plans:", e);
    return [];
  }
}

