export async function updateBusinessCategories(con, business_id, categories) {
  try {
    // Begin transaction
    await con.query("BEGIN");

    console.log("starting category update");

    // 1. Get existing categories in DB
    const existing = await con.query(
      "SELECT category_id FROM public.business_category WHERE business_id = $1",
      [business_id]
    );

    console.log({ existing });

    const existingIds = existing.rows.map((r) => r.category_id);

    // Get only incoming category IDs that are not null
    const incomingIds = categories
      .filter((c) => c.category_id !== "")
      .map((c) => c.category_id);

    console.log(incomingIds);

    // 2. DELETE categories removed by user
    for (let oldId of existingIds) {
      if (!incomingIds.includes(oldId)) {
        // await con.query(
        //   "DELETE FROM public.business_category WHERE category_id = $1",
        //   [oldId]
        // );
        console.log(`delete ${oldId}`);
      }
    }

    // 3. INSERT or UPDATE categories
    for (let c of categories) {
      // NEW CATEGORY (no ID)
      if (c.category_id === null) {
        // await con.query(
        //   "INSERT INTO public.business_category (business_id, category_name) VALUES ($1, $2)",
        //   [business_id, c.category_name]
        // );
        console.log(`add ${c.category_name}`);
      }
      // EXISTING CATEGORY → UPDATE
      else {
        // await con.query(
        //   "UPDATE public.business_category SET category_name = $1 WHERE category_id = $2",
        //   [c.category_name, c.category_id]
        // );
        console.log(`update ${c.category_name}`);
      }
    }

    // Commit transaction
    // await con.query("COMMIT");
    return { success: true, message: "Categories updated successfully" };
  } catch (error) {
    // Rollback if error happens
    await con.query("ROLLBACK");
    console.error("Error updating categories:", error);
    throw error;
  }
}
