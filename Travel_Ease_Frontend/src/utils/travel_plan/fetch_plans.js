export async function fetch_plans() {
  try {
    const result = await fetch("http://localhost:3000/api/travel_plan/plans", {
      method: "GET",
    });

    const data = await result.json();

    console.log(data);

    return data;
  } catch (e) {
    console.error({ e });
  }
}
