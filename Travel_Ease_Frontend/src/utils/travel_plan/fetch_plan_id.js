import { endpoints } from '../../config/api.js';

export async function fetch_plan_id(id) {
  try {
    const result = await fetch(endpoints.travelPlan.byId(id), {
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
