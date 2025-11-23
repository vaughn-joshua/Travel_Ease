import { con } from "../../config/travelease_db.js";

export async function delete_activity(req, res) {
  const { id } = req.params;
  console.log("you are at create plan controller");

  try {
    const query = {
      name: "delete_activity",
      text: "DELETE FROM public.activity WHERE activity_id = $1",
      values: [id],
    };

    const result = await con.query(query);

    console.log({ result });

    console.log("deleted activity successfully");

    res.status(201).json({ message: "deleted activity successfully" });
  } catch (e) {
    res.send({ error: e });
  }
}
