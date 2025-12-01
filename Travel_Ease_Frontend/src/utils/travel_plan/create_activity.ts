import { endpoints } from "../../config/api";
import type { CreateActivityPayload, Activity } from "../../types/travelPlan";

interface CreateActivityResponse extends Activity {
  message: string;
}

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
      const errorBody = await result.text();
      console.error("Create activity error:", errorBody);
      throw new Error(`Failed to create activity: ${result.status}`);
    }

    // Backend returns normalized Activity DTO with message
    const responseData: CreateActivityResponse = await result.json();
    return responseData;
  } catch (e) {
    console.error("Error creating activity:", e);
    throw e;
  }
}
