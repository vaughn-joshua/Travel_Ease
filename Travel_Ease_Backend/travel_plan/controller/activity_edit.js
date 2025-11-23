import { con } from "../../config/travelease_db.js";

export async function activity_edit(req, res) {
  const { id } = req.params;
  const { budget_range, is_priority, notes, target_date } = req.body;

  console.log("editing...");

  console.log(id);
  console.log({ budget_range, is_priority, notes, target_date });

  try {
    console.log("boom starting na");
    const query = {
      name: "edit activity",
      text: "UPDATE public.activity SET budget_range = $1, is_priority = $2, notes = $3, target_date = $4 WHERE activity_id = $5",
      values: [budget_range, is_priority, notes, target_date, id],
    };

    const result = await con.query(query);

    console.log({ result });

    console.log("edited activity successfully");

    res.status(201).json({ messageg: "you edited the activty successfully" });
  } catch (e) {
    res.send({ error: e });
  }
}
