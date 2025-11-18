export async function fetch_activities(reference_id) {
  try {
    const result = await fetch(
      `http://localhost:3000/api/travel_plan/activities/${reference_id}`,
      {
        method: "GET",
      }
    );

    const data = await result.json();

    return data;
  } catch (e) {
    console.error({ e });
  }
}
