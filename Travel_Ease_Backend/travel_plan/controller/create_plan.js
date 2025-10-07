import { con } from "../../config/travelease_db.js";

export async function create_plan(req, res) {
  const { title, description, location, date, slots, collaborators } = req.body;
  console.log("you are at create plan controller");

  try {
    console.log({ title, description, location, date, slots, collaborators });

    const query = {
      name: "create travel_plan",
      text: "INSERT INTO travel_plan (name, user_id, description, max_slots, location) VALUES ($1, $2, $3, $4, $5)",
      values: [title, 1, description, slots, location],
    };

    const result = await con.query(query);

    console.log({ result });

    console.log("created user");

    res.status(201).json({ messageg: "you are at create plan" });
  } catch (e) {
    res.send({ error: e });
  }
}
