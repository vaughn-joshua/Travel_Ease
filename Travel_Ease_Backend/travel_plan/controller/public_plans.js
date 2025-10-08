import { con } from "../../config/travelease_db.js";

export async function public_plans(req, res) {
  try {
    const query = {
      name: "fetch-public-plans",
      text: "SELECT name, start_date, end_date, description, location FROM public.travel_plan WHERE visibility = $1;",
      values: [true],
    };

    const result = await con.query(query);

    // console.log("users: ", result.rows);
    console.log("successful public plans fetch");
    res.send(result.rows);
  } catch (e) {
    res.send({ error: e });
  }
}
