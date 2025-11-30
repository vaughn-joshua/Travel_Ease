import { endpoints } from "../../config/api";
import type { CreateActivityPayload, Activity } from "../../types/travelPlan";

export async function create_activity(data: CreateActivityPayload): Promise<Activity | undefined> {
  try {
    // Get the auth token from localStorage
    const token = localStorage.getItem("token");
    
    if (!token) {
      throw new Error("Authentication required. Please log in.");
    }

    const result = await fetch(endpoints.travelPlan.createActivity, {
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
      throw new Error(`Failed to create activity: ${result.status}`);
    }

    const responseData: Activity = await result.json();
    return responseData;
  } catch (e) {
    console.error("Error creating activity:", e);
    throw e;
  }
}
