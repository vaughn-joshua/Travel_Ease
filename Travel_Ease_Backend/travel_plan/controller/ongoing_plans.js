import { prisma } from "../../src/lib/prisma.js";

export async function ongoing_plan(req, res) {
  try {
    const plans = await prisma.travelPlan.findMany({
      where: {
        status: 'Active'
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

    console.log("successful ongoing plans fetch");
    res.json(plans);
  } catch (error) {
    console.error("Error fetching ongoing plans:", error);
    res.status(500).json({ error: error.message });
  }
}
