import { con } from "../../config/travelease_db.js";

export async function update_activity(req, res) {
  const { id } = req.params; // travel_plan_id
  const { start } = req.body; // start is in milliseconds

  console.log("Editing...");

  try {
    // 1. Fetch all activities for the travel plan
    const fetchQuery = {
      text: "SELECT activity_id, target_date FROM public.activity WHERE travel_plan_id = $1",
      values: [id],
    };

    const activities = await con.query(fetchQuery);

    if (activities.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No activities found for this travel plan." });
    }

    // 2. Add milliseconds to each activity's target_date
    const startDate = new Date(start); // base date in ms

    const updatedActivities = activities.rows.map((activity, index) => {
      // Each activity gets an incremental offset, e.g., 1 day apart
      const newDate = new Date(startDate.getTime() + index * 86400000); // +1 day per activity
      const formattedDate = newDate.toISOString().split("T")[0];
      return { id: activity.activity_id, newDate: formattedDate };
    });

    // 3. Update each activity in the DB
    for (const act of updatedActivities) {
      const updateQuery = {
        text: "UPDATE public.activity SET target_date = $1 WHERE activity_id = $2",
        values: [act.newDate, act.id],
      };
      await con.query(updateQuery);
    }

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
