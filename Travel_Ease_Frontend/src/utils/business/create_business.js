export async function create_business(data) {
  try {
    const result = await fetch(
      "http://localhost:3000/api/business/create_business",
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
