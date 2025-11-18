export async function delete_activity(id) {
  try {
    const response = await fetch(
      `http://localhost:3000/api/travel_plan/delete_activity/${id}`,
      {
        method: "DELETE",
      }
    );

    const result = await response.json();
    console.log(result.message || "Activity deleted successfully");
  } catch (e) {
    console.log(e);
  }
}
