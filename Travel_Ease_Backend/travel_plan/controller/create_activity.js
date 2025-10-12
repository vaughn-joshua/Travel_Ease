import { con } from "../../config/travelease_db.js";

export async function create_activity(req, res) {
  const {
    travel_plan_id,
    business_id,
    notes,
    target_date,
    budget_range,
    user_id,
  } = req.body;

  try {
    // console.log({ title, description, location, date, slots, collaborators });

    const query = {
      name: "create activity",
      text: "INSERT INTO activity (travel_plan_id, business_id, notes, target_date, budget_range, user_id) VALUES ($1, $2, $3, $4, $5, $6)",
      values: [
        travel_plan_id,
        business_id,
        notes,
        target_date,
        budget_range,
        user_id,
      ],
    };

    const result = await con.query(query);

    console.log({ result });

    console.log("created plan successfully");

    res.status(201).json({ messageg: "you are at create plan" });
  } catch (e) {
    res.send({ error: e });
  }
}
