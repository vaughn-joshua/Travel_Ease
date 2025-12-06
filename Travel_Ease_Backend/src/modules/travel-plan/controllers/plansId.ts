import { prisma, executeWithRetry, handlePrismaError } from "../../../lib/prismaHelpers.js";
import { formatPlan } from "../utils/formatPlan.js";
import { getAccommodationForPlans } from "../utils/getAccommodation.js";
import { Request, Response } from "express";

export async function plans_id(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const plan = await executeWithRetry(() =>
      prisma.travelPlan.findUnique({
        where: { travel_plan_id: parseInt(id) },
        select: {
          travel_plan_id: true,
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
      })
    );

    if (!plan) {
      return res.status(404).json({ error: "Travel plan not found" });
    }

    // Fetch accommodation for this plan
    const accommodationMap = await getAccommodationForPlans([plan.travel_plan_id]);
    const accommodation = accommodationMap.get(plan.travel_plan_id) || null;

    console.log("successful fetch plan id");
    res.json(formatPlan(plan, { accommodation })); // Return as single object with normalized DTO
  } catch (error) {
    console.error("Error fetching plan:", error);
    return handlePrismaError(error, res, 'Fetching plan');
  }
}

