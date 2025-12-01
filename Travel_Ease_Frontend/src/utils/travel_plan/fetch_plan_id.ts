import { endpoints } from "../../config/api";
import type { TravelPlan } from "../../types/travelPlan";

export async function fetch_plan_id(id: number | string): Promise<TravelPlan | undefined> {
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

    const result = await fetch(endpoints.travelPlan.byId(id), {
      method: "GET",
      headers,
    });

    if (!result.ok) {
      if (result.status === 401) {
        throw new Error("Session expired. Please log in again.");
      }
      throw new Error(`Failed to fetch plan: ${result.status}`);
    }

    // Backend returns normalized DTO as single object
    const data: TravelPlan = await result.json();
    return data;
  } catch (e) {
    console.error("Error fetching plan:", e);
    throw e;
  }
}
