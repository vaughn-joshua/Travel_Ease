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

export async function fetch_public_plans(): Promise<TravelPlan[]> {
  try {
    const result = await fetch(endpoints.travelPlan.public, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!result.ok) {
      throw new Error(`Failed to fetch public plans: ${result.status}`);
    }

    const response: PaginatedResponse = await result.json();
    // Backend returns normalized DTOs in data array
    return response.data;
  } catch (e) {
    console.error("Error fetching public plans:", e);
    return [];
  }
}

