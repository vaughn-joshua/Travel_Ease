import { endpoints } from "../../config/api";
import type { EditActivityDatePayload, Activity } from "../../types/travelPlan";

export async function edit_activity_date(
  id: number | string,
  data: EditActivityDatePayload
): Promise<Activity | undefined> {
  try {
    // Get the auth token from localStorage
    const token = localStorage.getItem("token");
    
    if (!token) {
      throw new Error("Authentication required. Please log in.");
    }

    const result = await fetch(endpoints.travelPlan.updateActivity(id), {
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
      throw new Error(`Failed to update activity date: ${result.status}`);
    }

    const responseData: Activity = await result.json();
    return responseData;
  } catch (e) {
    console.error("Error updating activity date:", e);
    throw e;
  }
}
