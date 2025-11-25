import { prisma } from "../../src/lib/prisma.js";

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

  console.log("backend creating activity");

  try {
    const activity = await prisma.activity.create({
      data: {
        travel_plan_id: parseInt(travel_plan_id),
        notes,
        target_date: target_date ? new Date(target_date) : null,
        budget_range,
        user_id: user_id || 1,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null
      }
    });

    console.log("created activity successfully");
    res.status(201).json({ 
      message: "Activity created successfully",
      activity_id: activity.activity_id
    });
  } catch (error) {
    console.error("Error creating activity:", error);
    res.status(500).json({ error: error.message });
  }
}
