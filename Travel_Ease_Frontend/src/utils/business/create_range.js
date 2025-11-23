export async function create_range(data) {
  try {
    const result = await fetch(
      "http://localhost:3000/api/business/price_range",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    const newData = await result.json();

    console.log(newData);
  } catch (error) {
    console.log(error);
  }
}
