import { prisma } from "../../src/lib/prisma.js";

export async function create_plan(req, res) {
  const {
    title,
    description,
    location,
    start_date,
    end_date,
    slots,
    collaborators,
  } = req.body;
  
  const userId = req.body.user_id || 1; // Default to 1 if not provided
  console.log("you are at create plan controller");

  try {
    const travelPlan = await prisma.travelPlan.create({
      data: {
        name: title,
        user_id: userId,
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
        description,
        max_slots: slots,
        location,
        status: 'Draft'
      }
    });

    console.log("created plan successfully");
    res.status(201).json({ 
      message: "Travel plan created successfully",
      travel_plan_id: travelPlan.travel_plan_id
    });
  } catch (error) {
    console.error("Error creating travel plan:", error);
    res.status(500).json({ error: error.message });
  }
}
