import { endpoints } from "../../config/api";
import type { CreatePlanPayload, TravelPlan } from "../../types/travelPlan";

interface CreatePlanResponse extends TravelPlan {
  message: string;
}

export async function create_plan(data: CreatePlanPayload): Promise<TravelPlan | undefined> {
  try {
    // Get the auth token from localStorage
    const token = localStorage.getItem("token");
    
    if (!token) {
      throw new Error("Authentication required. Please log in.");
    }

    console.log("Creating plan with data:", JSON.stringify(data, null, 2));

    const result = await fetch(endpoints.travelPlan.createPlan, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!result.ok) {
      const errorBody = await result.text();
      console.error("Create plan error response:", errorBody);
      
      if (result.status === 401) {
        throw new Error("Session expired. Please log in again.");
      }
      if (result.status === 400) {
        try {
          const errorJson = JSON.parse(errorBody);
          throw new Error(errorJson.message || errorJson.error || `Validation failed: ${result.status}`);
        } catch {
          throw new Error(`Failed to create plan: ${result.status}`);
        }
      }
      throw new Error(`Failed to create plan: ${result.status}`);
    }

    // Backend returns normalized DTO with message
    const responseData: CreatePlanResponse = await result.json();
    return responseData;
  } catch (e) {
    console.error("Error creating plan:", e);
    throw e;
  }
}
