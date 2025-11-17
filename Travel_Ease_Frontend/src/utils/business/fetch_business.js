export async function fetch_business(id) {
  try {
    const result = await fetch(
      `http://localhost:3000/api/business/fetch_business/${id}`,
      {
        method: "GET",
      }
    );

    const data = await result.json();

    // console.log(data);

    return data[0];
  } catch (error) {
    console.log(error);
  }
}
