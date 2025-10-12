export async function fetch_businesses() {
  try {
    const result = await fetch(
      "http://localhost:3000/api/business/businesses",
      {
        method: "GET",
      }
    );

    const data = await result.json();

    return data;
  } catch (e) {
    console.error({ e });
  }
}
