import { prisma } from "../../src/lib/prisma.js";

export async function plans_id(req, res) {
  try {
    const { id } = req.params;

    const plan = await prisma.travelPlan.findUnique({
      where: {
        travel_plan_id: parseInt(id)
      },
      select: {
        name: true,
        user_id: true,
        start_date: true,
        end_date: true,
        description: true,
        location: true,
        status: true,
        max_slots: true,
        visibility: true
      }
    });

    if (!plan) {
      return res.status(404).json({ error: "Travel plan not found" });
    }

    console.log("successful fetch plan id");
    res.json([plan]); // Return as array to match original behavior
  } catch (error) {
    console.error("Error fetching plan:", error);
    res.status(500).json({ error: error.message });
  }
}
