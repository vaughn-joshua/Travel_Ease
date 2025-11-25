import { prisma } from "../../src/lib/prisma.js";

export async function fetch_activities(req, res) {
  try {
    const { id } = req.params;

    const activities = await prisma.activity.findMany({
      where: {
        travel_plan_id: parseInt(id)
      },
      include: {
        user: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true
          }
        },
        business: {
          select: {
            business_id: true,
            name: true,
            latitude: true,
            longtitude: true
          }
        }
      }
    });

    // Flatten the response to match original format
    const formattedActivities = activities.map(activity => ({
      activity_id: activity.activity_id,
      notes: activity.notes,
      target_date: activity.target_date,
      budget_range: activity.budget_range,
      user_id: activity.user_id,
      is_priority: activity.is_priority,
      lat: activity.lat,
      lng: activity.lng,
      first_name: activity.user.first_name
    }));

    res.json(formattedActivities);
  } catch (error) {
    console.error("Error fetching activities:", error);
    res.status(500).json({ error: error.message });
  }
}
