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
  
  // Use authenticated user ID from middleware
  const userId = req.user.id;

  try {
    // Use transaction to create plan and add creator as admin participant
    const result = await prisma.$transaction(async (tx) => {
      // Create travel plan
      const travelPlan = await tx.travelPlan.create({
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

      // Add creator as Admin participant
      await tx.participant.create({
        data: {
          travel_plan_id: travelPlan.travel_plan_id,
          user_id: userId,
          role: 'Admin',
          status: true
        }
      });

      return travelPlan;
    });

    res.status(201).json({ 
      message: "Travel plan created successfully",
      travel_plan_id: result.travel_plan_id
    });
  } catch (error) {
    console.error("Error creating travel plan:", error);
    res.status(500).json({ error: error.message });
  }
}
