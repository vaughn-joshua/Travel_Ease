import { endpoints } from '../../config/api.js';

export async function edit_activity_date(submitted) {
  try {
    const result = await fetch(endpoints.travelPlan.updateActivity(submitted.id), {
      method: "PUT",
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
