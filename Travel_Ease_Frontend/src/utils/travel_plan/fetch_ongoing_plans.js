export async function fetch_ongoing_plans() {
  try {
    const result = await fetch(
      "http://localhost:3000/api/travel_plan/ongoing_plan",
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
