import { endpoints } from "../../config/api";

export async function delete_activity(id: number | string): Promise<boolean> {
  try {
    // Get the auth token from localStorage
    const token = localStorage.getItem("token");
    
    if (!token) {
      throw new Error("Authentication required. Please log in.");
    }

    const result = await fetch(endpoints.travelPlan.deleteActivity(id), {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!result.ok) {
      if (result.status === 401) {
        throw new Error("Session expired. Please log in again.");
      }
      throw new Error(`Failed to delete activity: ${result.status}`);
    }

    return true;
  } catch (e) {
    console.error("Error deleting activity:", e);
    return false;
  }
}
