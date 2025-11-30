import { endpoints } from "../../config/api";
import type { TravelPlan } from "../../types/travelPlan";

interface JoinPlanPayload {
  travel_plan_id: number | string;
  user_id: number;
}

interface JoinPlanResponse {
  message: string;
  participant: {
    id: number;
    travel_plan_id: number;
    user_id: number;
    role: string;
  };
}

export async function join_plan(data: JoinPlanPayload): Promise<JoinPlanResponse | undefined> {
  try {
    // First get the plan details to use in quick join
    const result = await fetch(endpoints.travelPlan.quickJoin, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!result.ok) {
      throw new Error(`Failed to join plan: ${result.status}`);
    }

    const responseData: JoinPlanResponse = await result.json();
    return responseData;
  } catch (e) {
    console.error("Error joining plan:", e);
    throw e;
  }
}

