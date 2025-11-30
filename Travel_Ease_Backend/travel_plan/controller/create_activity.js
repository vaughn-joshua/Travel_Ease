import { Activity } from "../../src/models/index.js";
import { executeWithRetry } from "../../src/lib/sequelize.js";
import { handleSequelizeError } from "../../src/lib/queryHelpers.js";

export async function create_activity(req, res) {
  const {
    travel_plan_id,
    notes,
    target_date,
    budget_range,
    lat,
    lng,
    location,
    brgy,
    province,
    city,
  } = req.body;

  // Use authenticated user ID from middleware
  const userId = req.user.id;

  try {
    const activity = await executeWithRetry(() =>
      Activity.create({
        travel_plan_id: parseInt(travel_plan_id),
        notes,
        target_date: target_date ? new Date(target_date) : null,
        budget_range,
        user_id: userId,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null
      })
    );

    console.log("created activity successfully");
    res.status(201).json({ 
      message: "Activity created successfully",
      activity_id: activity.activity_id
    });
  } catch (error) {
    console.error("Error creating activity:", error);
    return handleSequelizeError(error, res, 'Creating activity');
  }
}
