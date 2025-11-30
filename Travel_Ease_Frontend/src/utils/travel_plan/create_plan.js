import { endpoints } from '../../config/api.js';

export async function create_plan(submitted) {
  try {
    console.log("submitted");
    console.log(submitted);
    const result = await fetch(endpoints.travelPlan.createPlan, {
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
