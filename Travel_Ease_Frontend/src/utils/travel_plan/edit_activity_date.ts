import { endpoints } from "../../config/api";
import type { EditActivityDatePayload, Activity } from "../../types/travelPlan";

export async function edit_activity_date(
  id: number | string,
  data: EditActivityDatePayload
): Promise<Activity | undefined> {
  try {
    const result = await fetch(endpoints.travelPlan.updateActivity(id), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!result.ok) {
      throw new Error(`Failed to update activity date: ${result.status}`);
    }

    const responseData: Activity = await result.json();
    return responseData;
  } catch (e) {
    console.error("Error updating activity date:", e);
    throw e;
  }
}

