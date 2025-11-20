import { con } from "../../config/travelease_db.js";

export async function create_activity(req, res) {
  const {
    travel_plan_id,
    notes,
    target_date,
    budget_range,
    user_id,
    lat,
    lng,
    location,
    brgy,
    province,
    city,
  } = req.body;

  console.log("backend");

  console.log({
    travel_plan_id,
    notes,
    target_date,
    budget_range,
    user_id,
    lat,
    lng,
    location,
    brgy,
    province,
    city,
  });

  try {
    const query = {
      name: "create activity",
      text: `INSERT INTO activity 
              (travel_plan_id, notes, target_date, budget_range, user_id, lat, lng, location, brgy, province, city) 
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      values: [
        travel_plan_id,
        notes,
        target_date,
        budget_range,
        user_id,
        lat,
        lng,
        location,
        brgy,
        province,
        city,
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
