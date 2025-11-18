export async function join_plan(submitted) {
  try {
    console.log(submitted);
    const result = await fetch(
      "http://localhost:3001/api/travel_plan/quick_join",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitted),
      }
    );

    const data = await result.json();

    return data;
  } catch (e) {
    console.log(e);
  }
}
