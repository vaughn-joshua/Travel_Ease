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

    if (result.status === 201) {
      console.log({ message: "created successfully", status: result.status });
    }
  } catch (e) {
    console.log(e);
  }
}
