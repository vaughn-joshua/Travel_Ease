import { endpoints } from "../../config/api";
import type { TravelPlan } from "../../types/travelPlan";

export async function fetch_plan_id(id: number | string): Promise<TravelPlan | undefined> {
  try {
    const result = await fetch(endpoints.travelPlan.byId(id), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!result.ok) {
      throw new Error(`Failed to fetch plan: ${result.status}`);
    }

    const data: TravelPlan = await result.json();
    return data;
  } catch (e) {
    console.error("Error fetching plan:", e);
    return undefined;
  }
}

