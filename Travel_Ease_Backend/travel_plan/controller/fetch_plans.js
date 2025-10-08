import { con } from "../../config/travelease_db.js";

export async function fetch_plans(req, res) {
  try {
    const query = {
      name: "fetch-plans",
      text: "SELECT name, start_date, end_date, description, location FROM public.travel_plan WHERE status = $1;",
      values: ["Draft"],
    };

    const result = await con.query(query);

    // console.log("users: ", result.rows);
    console.log("successful fetch plans");
    res.send(result.rows);
  } catch (e) {
    res.send({ error: e });
  }
}
