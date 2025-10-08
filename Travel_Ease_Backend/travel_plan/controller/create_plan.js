import { con } from "../../config/travelease_db.js";

export async function create_plan(req, res) {
  const { title, description, location, date, end_date, slots, collaborators } =
    req.body;
  console.log("you are at create plan controller");

  try {
    // console.log({ title, description, location, date, slots, collaborators });

    const query = {
      name: "create travel_plan",
      text: "INSERT INTO travel_plan (name, user_id, start_date, end_date, description, max_slots, location) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      values: [title, 1, date, end_date, description, slots, location],
    };

    const result = await con.query(query);

    console.log({ result });

    console.log("created plan successfully");

    res.status(201).json({ messageg: "you are at create plan" });
  } catch (e) {
    res.send({ error: e });
  }
}
