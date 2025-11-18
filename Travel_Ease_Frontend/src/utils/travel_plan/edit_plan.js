export async function edit_plan(edited_data) {
  try {
    const result = await fetch(
      `http://localhost:3000/api/travel_plan/edit_plan/${edited_data.travel_plan}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(edited_data),
      }
    );

    const data = await result.json();

    if (result.status === 201) {
      console.log({ message: "successfully edited", status: result.status });
    }
  } catch (e) {
    console.log(e);
  }
}
