export async function fetch_categories(id) {
  try {
    const result = await fetch(
      `http://localhost:3000/api/business/fetch_categories/${id}`,
      {
        method: "GET",
      }
    );

    const data = await result.json();

    // console.log(data);

    return data;
  } catch (error) {
    console.log(error);
  }
}
