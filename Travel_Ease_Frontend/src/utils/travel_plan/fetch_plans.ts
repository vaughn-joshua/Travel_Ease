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

export async function fetch_plans(): Promise<TravelPlan[]> {
  // Skip API call if not authenticated
  const token = localStorage.getItem("token");
  if (!token) {
    return [];
  }

  try {
    const result = await fetch(endpoints.travelPlan.plans, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    // 401/403 means token is missing or invalid - clear it and return empty (silently)
    if (result.status === 401 || result.status === 403) {
      localStorage.removeItem("token");
      return [];
    }

    if (!result.ok) {
      // Only log non-auth errors in development
      if (import.meta.env.DEV) {
        console.error(`Failed to fetch plans: ${result.status}`);
      }
      return [];
    }

    const response: PaginatedResponse = await result.json();
    // Backend returns normalized DTOs in data array
    return response.data;
  } catch (e) {
    // Only log non-network errors in development
    if (import.meta.env.DEV && !(e instanceof TypeError && e.message.includes('fetch'))) {
      console.error("Error fetching plans:", e);
    }
    return [];
  }
}

