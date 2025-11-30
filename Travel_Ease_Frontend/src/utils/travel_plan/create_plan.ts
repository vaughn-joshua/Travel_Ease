import { endpoints } from "../../config/api";
import type { CreatePlanPayload, TravelPlan } from "../../types/travelPlan";

export async function create_plan(data: CreatePlanPayload): Promise<TravelPlan | undefined> {
  try {
    const result = await fetch(endpoints.travelPlan.createPlan, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!result.ok) {
      throw new Error(`Failed to create plan: ${result.status}`);
    }

    const responseData: TravelPlan = await result.json();
    return responseData;
  } catch (e) {
    console.error("Error creating plan:", e);
    throw e;
  }
}

