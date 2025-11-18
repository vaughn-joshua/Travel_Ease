export async function edit_activity_date(submitted) {
  console.log(submitted);
  try {
    const result = await fetch(
      `http://localhost:3000/api/travel_plan/update_activity/${submitted.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitted),
      }
    );

    const data = await result.json();

    if (result.status === 201) {
      console.log({ message: "successfully edited", status: result.status });
    }
  } catch (error) {
    console.log(error);
  }
}
