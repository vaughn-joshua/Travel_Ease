import { endpoints } from "../../config/api";
import type { Activity } from "../../types/travelPlan";

export async function fetch_activities(id: number | string): Promise<Activity[]> {
  try {
    // Get the auth token from localStorage
    const token = localStorage.getItem("token");
    
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    
    // Add authorization header if token exists
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const result = await fetch(endpoints.travelPlan.activities(id), {
      method: "GET",
      headers,
    });

    if (!result.ok) {
      if (result.status === 401) {
        console.warn("Unauthorized - please log in");
        return [];
      }
      throw new Error(`Failed to fetch activities: ${result.status}`);
    }

    // Backend returns normalized Activity DTOs
    const data: Activity[] = await result.json();
    return data;
  } catch (e) {
    console.error("Error fetching activities:", e);
    return [];
  }
}
