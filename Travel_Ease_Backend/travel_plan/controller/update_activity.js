import { con } from "../../config/travelease_db.js";

export async function update_activity(req, res) {
  const { id } = req.params; // travel_plan_id
  const { start } = req.body; // start is in milliseconds

  console.log("Editing...");

  try {
    // 1. Fetch all activities for the travel plan
    const query1 = {
      text: "SELECT activity_id, target_date FROM public.activity WHERE travel_plan_id = $1",
      values: [id],
    };

    const activities = await con.query(query1);

    if (activities.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No activities found for this travel plan." });
    }

    // 2. Add milliseconds to each activity's target_date
    const start_ms = Number(start);

    const updated_activities = activities.rows.map((activity, index) => {
      const new_date = new Date(activity.target_date);

      const mili_sec = new_date.getTime() + start_ms;
      const updated = new Date(mili_sec);
      const date_string = updated.toISOString().slice(0, 10);

      return date_string;
    });

    // console.log(updated_activities);

    console.log(activities.rows);

    // 3. Update each activity in the DB
    updated_activities.map(async (data, key) => {
      const query2 = {
        text: "UPDATE public.activity SET target_date = $1 WHERE activity_id = $2",
        values: [data, activities.rows[key].activity_id],
      };
      const result = await con.query(query2);
    });

    console.log("Edited all activity dates successfully");

    // 4. Respond with the updated data
    res.status(200).json({
      message: "All activities updated successfully",
      updated: updatedActivities,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}
