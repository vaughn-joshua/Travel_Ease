export async function fetch_public_plans() {
  try {
    const result = await fetch(
      "http://localhost:3001/api/travel_plan/public_plans",
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
