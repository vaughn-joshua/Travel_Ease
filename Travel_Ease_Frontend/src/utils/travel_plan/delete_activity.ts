import { endpoints } from "../../config/api";

export async function delete_activity(id: number | string): Promise<boolean> {
  try {
    const result = await fetch(endpoints.travelPlan.deleteActivity(id), {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!result.ok) {
      throw new Error(`Failed to delete activity: ${result.status}`);
    }

    return true;
  } catch (e) {
    console.error("Error deleting activity:", e);
    return false;
  }
}

