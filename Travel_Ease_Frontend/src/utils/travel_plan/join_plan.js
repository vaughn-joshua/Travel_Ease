import { endpoints } from '../../config/api.js';

export async function join_plan(submitted) {
  try {
    console.log(submitted);
    const result = await fetch(endpoints.travelPlan.quickJoin, {
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
