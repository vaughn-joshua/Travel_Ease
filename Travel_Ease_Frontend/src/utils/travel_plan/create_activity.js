import { endpoints } from '../../config/api.js';

export async function create_activity(submitted) {
  try {
    console.log(submitted);
    const result = await fetch(endpoints.travelPlan.createActivity, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(submitted),
    });

    const data = await result.json();
    return data;
  } catch (e) {
    console.log(e);
  }
}
