import { con } from "../../config/travelease_db.js";

export async function quick_join(req, res) {
  try {
    console.log("quick join, finding matching plan");
    const { start_date, end_date, location } = req.body;

    const query = {
      name: "quick_join",
      text: `
        SELECT * FROM public.travel_plan
        WHERE start_date <= $2::date AND end_date >= $1::date AND location = $3 AND visibility = TRUE
        `,
      values: [start_date, end_date, location],
    };

    const result = await con.query(query);

    console.log(result.rows);

    res.send(result.rows);
  } catch (e) {
    console.log(e);
  }
}
