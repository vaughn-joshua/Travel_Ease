export async function create_activity(input) {
  try {
    console.log({ input, message: "we are at front end" });
    const result = await fetch(
      "http://localhost:3001/api/travel_plan/create_activity",
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
