import { con } from "../../config/travelease_db.js";

export async function plan_edit(req, res) {
  const { id } = req.params;
  const {
    description,
    name,
    location,
    max_slots,
    start_date,
    end_date,
    visibility,
  } = req.body;

  console.log("editing...");

  try {
    const query = {
      name: "edit plan",
      text: `UPDATE public.travel_plan 
                SET description = $1, name = $2, location = $3, max_slots = $4, start_date = $5, end_date = $6, visibility = $7, 
                  visibility_timestamp = CASE 
                    WHEN $7 = TRUE AND visibility = FALSE THEN NOW()
                    ELSE visibility_timestamp
                  END
                WHERE travel_plan_id = $8`,
      values: [
        description,
        name,
        location,
        max_slots,
        start_date,
        end_date,
        visibility,
        id,
      ],
    };

    const result = await con.query(query);

    console.log({ result });

    console.log("edited activity successfully");

    res.status(201).json({ messageg: "you edited the activty successfully" });
  } catch (e) {
    res.send({ error: e });
  }
}
