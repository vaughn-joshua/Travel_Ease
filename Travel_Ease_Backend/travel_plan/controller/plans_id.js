import { con } from "../../config/travelease_db.js";

export async function plans_id(req, res) {
  try {
    const { id } = req.params;

    const query = {
      name: "fetch_plan_id",
      text: "SELECT name, user_id, start_date, end_date, description, location, status, max_slots, visibility FROM public.travel_plan WHERE travel_plan_id = $1;",
      values: [id],
    };

    const result = await con.query(query);

    // console.log(result.rows);
    console.log("successful fetch plan id");
    res.send(result.rows);
  } catch (e) {
    res.send({ error: e });
  }
}
