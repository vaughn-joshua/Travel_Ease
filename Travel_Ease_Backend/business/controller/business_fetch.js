import { con } from "../../config/travelease_db.js";

export async function business_fetch(req, res) {
  const { id } = req.params;
  try {
    const query = {
      name: "fetch business",
      text: "SELECT * FROM public.business WHERE business_id = $1",
      values: [id],
    };

    const result = await con.query(query);

    console.log(result.rows);

    res.json(result.rows);
  } catch (error) {
    console.log(error);
  }
}
