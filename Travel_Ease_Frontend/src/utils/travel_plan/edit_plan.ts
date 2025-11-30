import { endpoints } from "../../config/api";
import type { UpdatePlanPayload, TravelPlan } from "../../types/travelPlan";

export async function edit_plan(
  id: number | string,
  data: UpdatePlanPayload
): Promise<TravelPlan | undefined> {
  try {
    const result = await fetch(endpoints.travelPlan.editPlan(id), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!result.ok) {
      throw new Error(`Failed to update plan: ${result.status}`);
    }

    const responseData: TravelPlan = await result.json();
    return responseData;
  } catch (e) {
    console.error("Error updating plan:", e);
    throw e;
  }
}

