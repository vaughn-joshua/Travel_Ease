import { endpoints } from "../../config/api";
import type { UpdateActivityPayload, Activity } from "../../types/travelPlan";

export async function edit_activity(
  id: number | string,
  data: UpdateActivityPayload
): Promise<Activity | undefined> {
  try {
    const result = await fetch(endpoints.travelPlan.editActivity(id), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!result.ok) {
      throw new Error(`Failed to update activity: ${result.status}`);
    }

    const responseData: Activity = await result.json();
    return responseData;
  } catch (e) {
    console.error("Error updating activity:", e);
    throw e;
  }
}

