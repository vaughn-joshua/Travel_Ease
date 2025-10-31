import { con } from "../../config/travelease_db.js";

export async function quick_join(req, res) {
  try {
    const { date, location } = req.body;
    console.log(req.body);
    console.log(date[0]);
    console.log(date[1]);

    const query = {
      name: "quick_join",
      text: `
        SELECT * FROM public.travel_plan
        WHERE start_date <= $2::date AND end_date >= $1::date AND location = $3
        `,
      values: [date[0], date[1], location],
    };

    const result = await con.query(query);

    res.send(result.rows);
  } catch (e) {
    console.log(e);
  }
}
