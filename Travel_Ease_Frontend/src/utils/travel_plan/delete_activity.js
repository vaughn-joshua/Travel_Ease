import { endpoints } from '../../config/api.js';

export async function delete_activity(id) {
  try {
    const result = await fetch(endpoints.travelPlan.deleteActivity(id), {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await result.json();
    return data;
  } catch (e) {
    console.log(e);
  }
}
