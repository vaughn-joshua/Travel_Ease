import api from "../../services/api";
import type { TravelPlan } from "../../types/travelPlan";

export async function fetch_plan_id(
  id: number | string
): Promise<TravelPlan | null> {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      console.warn("fetch_plan_id: No auth token found in localStorage");
      throw new Error("Authentication required. Please log in.");
    }

    const response = await api.get<TravelPlan>(`/travel_plan/plans/${id}`);
    return response.data;
  } catch (e: any) {
    console.error("fetch_plan_id error:", e);

    if (e.response?.status === 401) {
      throw new Error("Session expired. Please log in again.");
    }
    if (e.response?.status === 403) {
      throw new Error("You do not have permission to view this plan.");
    }
    if (e.response?.status === 404) {
      throw new Error("Plan not found.");
    }
    throw new Error(
      e.response?.data?.error ||
        `Failed to fetch plan: ${e.response?.status || "unknown error"}`
    );
  }
}
