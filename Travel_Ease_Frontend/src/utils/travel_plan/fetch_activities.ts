import { endpoints } from "../../config/api";
import type { Activity } from "../../types/travelPlan";

export async function fetch_activities(id: number | string): Promise<Activity[]> {
  try {
    const result = await fetch(endpoints.travelPlan.activities(id), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!result.ok) {
      throw new Error(`Failed to fetch activities: ${result.status}`);
    }

    const data: Activity[] = await result.json();
    return data;
  } catch (e) {
    console.error("Error fetching activities:", e);
    return [];
  }
}

