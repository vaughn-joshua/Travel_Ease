import { con } from "../../config/travelease_db.js";

export async function ongoing_plan(req, res) {
  try {
    const query = {
      name: "fetch-ongoing-plans",
      text: "SELECT travel_plan_id, name, start_date, end_date, description, location FROM public.travel_plan WHERE status = $1;",
      values: ["Active"],
    };

    const result = await con.query(query);

    // console.log("users: ", result.rows);
    console.log("successful ongoing plans fetch");
    res.send(result.rows);
  } catch (e) {
    res.send({ error: e });
  }
}
