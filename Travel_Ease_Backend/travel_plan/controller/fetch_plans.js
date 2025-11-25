import { prisma } from "../../src/lib/prisma.js";

export async function fetch_plans(req, res) {
  try {
    const plans = await prisma.travelPlan.findMany({
      where: {
        status: 'Draft'
      },
      select: {
        travel_plan_id: true,
        name: true,
        start_date: true,
        end_date: true,
        description: true,
        location: true
      }
    });

    console.log("successful fetch plans");
    res.json(plans);
  } catch (error) {
    console.error("Error fetching plans:", error);
    res.status(500).json({ error: error.message });
  }
}
