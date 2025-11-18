import { con } from "../../config/travelease_db.js";

export async function get_businesses(req, res) {
  try {
    const query = {
      name: "fetch businesses",
      text: "SELECT * FROM public.business",
    };

    const result = await con.query(query);

    console.log(result.rows);
    res.status(200).send(result.rows);
  } catch (e) {
    res.send({ error: e });
  }
}
