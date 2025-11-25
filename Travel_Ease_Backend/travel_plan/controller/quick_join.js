import { prisma } from "../../src/lib/prisma.js";

export async function quick_join(req, res) {
  try {
    console.log("quick join, finding matching plan...");
    const { start_date, end_date, location } = req.body;

    console.log({ start_date, end_date, location });

    // Find plans where:
    // - plan.start_date <= user's end_date
    // - plan.end_date >= user's start_date
    // - location matches
    // - visibility is true
    const plans = await prisma.travelPlan.findMany({
      where: {
        AND: [
          { start_date: { lte: new Date(end_date) } },
          { end_date: { gte: new Date(start_date) } },
          { location },
          { visibility: true }
        ]
      },
      include: {
        user: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true
          }
        }
      }
    });

    console.log(`Found ${plans.length} matching plans`);
    res.json(plans);
  } catch (error) {
    console.error("Error in quick join:", error);
    res.status(500).json({ error: error.message });
  }
}
