import { Activity, User, Business } from "../../src/models/index.js";
import { executeWithRetry } from "../../src/lib/sequelize.js";
import { handleSequelizeError } from "../../src/lib/queryHelpers.js";

export async function fetch_activities(req, res) {
  try {
    const { id } = req.params;

    const activities = await executeWithRetry(() =>
      Activity.findAll({
        where: { travel_plan_id: parseInt(id) },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['user_id', 'first_name', 'last_name']
          },
          {
            model: Business,
            as: 'business',
            attributes: ['business_id', 'name', 'latitude', 'longtitude']
          }
        ]
      })
    );

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
      first_name: activity.user?.first_name
    }));

    res.json(formattedActivities);
  } catch (error) {
    console.error("Error fetching activities:", error);
    return handleSequelizeError(error, res, 'Fetching activities');
  }
}
