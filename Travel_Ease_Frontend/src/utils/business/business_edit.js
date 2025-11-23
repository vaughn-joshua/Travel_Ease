export async function business_edit(details, id) {
  try {
    console.log(id);
    const result = await fetch(
      `http://localhost:3000/api/business/edit_business/${id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(details),
      }
    );

    const data = await result.json();
  } catch (error) {
    console.log(error);
  }
}
