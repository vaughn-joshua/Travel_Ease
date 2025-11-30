import { endpoints } from "../../config/api";
import type { TravelPlan } from "../../types/travelPlan";

export async function fetch_ongoing_plans(): Promise<TravelPlan[]> {
  try {
    const result = await fetch(endpoints.travelPlan.ongoing, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!result.ok) {
      throw new Error(`Failed to fetch ongoing plans: ${result.status}`);
    }

    const data: TravelPlan[] = await result.json();
    return data;
  } catch (e) {
    console.error("Error fetching ongoing plans:", e);
    return [];
  }
}

