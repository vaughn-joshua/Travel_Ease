import { con } from "../../config/travelease_db.js";

export async function fetch_activities(req, res) {
  try {
    const { id } = req.params;

    const query = {
      name: "fetch-activities",
      text: `
        SELECT 
          a.activity_id,
          a.business_id,
          a.title,
          a.notes,
          a.target_date,
          a.budget_range,
          a.user_id,
          a.is_priority,
          b.name AS business_name,
          b.rating,
          b.house_number,
          b.street,
          b.brgy,
          b.city,
          b.latitude,
          b.longtitude,
          u.first_name
        FROM public.activity AS a
        LEFT JOIN public.business AS b ON a.business_id = b.business_id
        INNER JOIN public."user" AS u ON a.user_id = u.user_id
        WHERE a.travel_plan_id = $1;
      `,
      values: [id],
    };

    const result = await con.query(query);

    res.send(result.rows);
  } catch (e) {
    res.send({ error: e });
  }
}
