import { prisma } from "../../src/lib/prisma.js";

export async function update_activity(req, res) {
  const { id } = req.params; // travel_plan_id
  const { start } = req.body; // start is in milliseconds

  console.log("Editing activity dates...");

  try {
    // 1. Fetch all activities for the travel plan
    const activities = await prisma.activity.findMany({
      where: {
        travel_plan_id: parseInt(id)
      },
      select: {
        activity_id: true,
        target_date: true
      }
    });

    if (activities.length === 0) {
      return res
        .status(404)
        .json({ message: "No activities found for this travel plan." });
    }

    // 2. Calculate new dates and update each activity
    const start_ms = Number(start);
    
    const updatePromises = activities.map(async (activity) => {
      if (activity.target_date) {
        const new_date = new Date(activity.target_date);
        const mili_sec = new_date.getTime() + start_ms;
        const updated = new Date(mili_sec);

        return prisma.activity.update({
          where: { activity_id: activity.activity_id },
          data: { target_date: updated }
        });
      }
      return null;
    });

    await Promise.all(updatePromises.filter(p => p !== null));

    console.log("Edited all activity dates successfully");

    res.status(200).json({
      message: "All activities updated successfully"
    });
  } catch (error) {
    console.error("Error updating activities:", error);
    res.status(500).json({ error: error.message });
  }
}
