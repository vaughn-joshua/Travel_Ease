import { endpoints } from "../../config/api";

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
    // Get the auth token from localStorage
    const token = localStorage.getItem("token");
    
    if (!token) {
      throw new Error("Authentication required. Please log in.");
    }

    const result = await fetch(endpoints.travelPlan.quickJoin, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!result.ok) {
      if (result.status === 401) {
        throw new Error("Session expired. Please log in again.");
      }
      throw new Error(`Failed to join plan: ${result.status}`);
    }

    const responseData: JoinPlanResponse = await result.json();
    return responseData;
  } catch (e) {
    console.error("Error joining plan:", e);
    throw e;
  }
}
