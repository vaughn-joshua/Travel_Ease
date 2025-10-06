export async function create_plan(input) {
  try {
    const result = await fetch(
      "http://localhost:3000/api/travel_plan/create_plan",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      }
    );

    const data = await result.json();
    console.log(data);
  } catch (e) {
    console.log(e);
  }
}
