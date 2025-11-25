import { prisma } from "../../src/lib/prisma.js";

export async function public_plans(req, res) {
  try {
    const plans = await prisma.travelPlan.findMany({
      where: {
        visibility: true
      },
      select: {
        travel_plan_id: true,
        name: true,
        start_date: true,
        end_date: true,
        max_slots: true,
        location: true,
        visibility_timestamp: true
      },
      orderBy: {
        visibility_timestamp: 'desc'
      }
    });

    console.log("successful public plans fetch");
    res.json(plans);
  } catch (error) {
    console.error("Error fetching public plans:", error);
    res.status(500).json({ error: error.message });
  }
}
