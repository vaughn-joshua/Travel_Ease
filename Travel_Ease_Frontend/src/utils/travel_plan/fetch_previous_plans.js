import { endpoints } from '../../config/api.js';

export async function fetch_previous_plans() {
  try {
    const result = await fetch(endpoints.travelPlan.previous, {
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
