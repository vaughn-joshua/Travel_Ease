import { prisma, executeWithRetry, handlePrismaError } from "../../src/lib/prismaHelpers.js";
import { formatPlan } from "../util/formatPlan.js";
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

    console.log("successful fetch plan id");
    res.json(formatPlan(plan)); // Return as single object with normalized DTO
  } catch (error) {
    console.error("Error fetching plan:", error);
    return handlePrismaError(error, res, 'Fetching plan');
  }
}

