import { endpoints } from "../../config/api";
import type { UpdatePlanPayload, TravelPlan } from "../../types/travelPlan";

export async function edit_plan(
  id: number | string,
  data: UpdatePlanPayload
): Promise<TravelPlan | undefined> {
  try {
    // Get the auth token from localStorage
    const token = localStorage.getItem("token");
    
    if (!token) {
      throw new Error("Authentication required. Please log in.");
    }

    const result = await fetch(endpoints.travelPlan.editPlan(id), {
      method: "PUT",
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
      throw new Error(`Failed to update plan: ${result.status}`);
    }

    const responseData: TravelPlan = await result.json();
    return responseData;
  } catch (e) {
    console.error("Error updating plan:", e);
    throw e;
  }
}
