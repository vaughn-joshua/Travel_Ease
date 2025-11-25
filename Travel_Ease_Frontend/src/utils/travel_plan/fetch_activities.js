import { endpoints } from '../../config/api.js';

export async function fetch_activities(reference_id) {
  try {
    const result = await fetch(endpoints.travelPlan.activities(reference_id), {
      method: "GET",
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
