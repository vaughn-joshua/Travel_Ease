import { endpoints } from '../../config/api.js';

export async function edit_plan(edited_data) {
  try {
    const result = await fetch(endpoints.travelPlan.editPlan(edited_data.travel_plan), {
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
