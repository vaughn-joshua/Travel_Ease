import { endpoints } from '../../config/api.js';

export async function edit_activity(edited_data) {
  try {
    const result = await fetch(endpoints.travelPlan.editActivity(edited_data.activity_id), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(edited_data),
    });

    const data = await result.json();
    return data;
  } catch (e) {
    console.log(e);
  }
}
