import api from "../../services/api";
import type { Activity } from "../../types/travelPlan";

interface ActivitiesResponse {
  data?: Activity[];
}

export async function fetch_activities(
  planId: number | string
): Promise<Activity[]> {
  try {
    const response = await api.get<ActivitiesResponse | Activity[]>(
      `/travel_plan/activities/${planId}`
    );

    // Handle different response shapes
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      return response.data.data || [];
    }
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  } catch (e) {
    console.error("Error fetching activities:", e);
    return [];
  }
}
