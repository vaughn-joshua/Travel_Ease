import { con } from "../../config/travelease_db.js";

export async function categories_fetch(req, res) {
  const { id } = req.params;
  console.log("getting categories");
  try {
    const query = {
      name: "fetch categories",
      text: "SELECT * FROM public.business_category WHERE business_id = $1",
      values: [id],
    };

    const result = await con.query(query);

    console.log(result.rows);

    res.json(result.rows);
  } catch (error) {
    console.log(error);
  }
}
