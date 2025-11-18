export async function fetch_plan_id(id) {
  try {
    const result = await fetch(
      `http://localhost:3001/api/travel_plan/plans/${id}`,
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
