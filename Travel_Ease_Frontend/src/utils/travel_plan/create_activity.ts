import { endpoints } from "../../config/api";
import type { CreateActivityPayload, Activity } from "../../types/travelPlan";

export async function create_activity(data: CreateActivityPayload): Promise<Activity | undefined> {
  try {
    const result = await fetch(endpoints.travelPlan.createActivity, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!result.ok) {
      throw new Error(`Failed to create activity: ${result.status}`);
    }

    const responseData: Activity = await result.json();
    return responseData;
  } catch (e) {
    console.error("Error creating activity:", e);
    throw e;
  }
}

