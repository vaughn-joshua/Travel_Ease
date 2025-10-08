import { con } from "../../config/travelease_db.js";

export async function previous_plans(req, res) {
  try {
    const query = {
      name: "fetch-previous-plans",
      text: "SELECT name, start_date, end_date, description, location FROM public.travel_plan WHERE status = $1;",
      values: ["Completed"],
    };

    const result = await con.query(query);

    // console.log("users: ", result.rows);
    console.log("successful previous plan fetch");
    res.send(result.rows);
  } catch (e) {
    res.send({ error: e });
  }
}
