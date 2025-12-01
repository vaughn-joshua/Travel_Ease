import { prisma, executeWithRetry, handlePrismaError } from "../../src/lib/prismaHelpers.js";
import { normalizeBudgetRange, formatActivity } from "../util/activityConstants.js";
import { Request, Response } from "express";

export async function create_activity(req: Request, res: Response) {
  const {
    travel_plan_id,
    notes,
    target_date,
    budget_range,
    lat,
    lng,
    location,
    name,
    brgy,
    province,
    city,
  } = req.body;

  // Use authenticated user ID from middleware
  const userId = req.user!.id;

  try {
    const activity = await executeWithRetry(() =>
      prisma.activity.create({
        data: {
          travel_plan_id: parseInt(travel_plan_id),
          notes,
          target_date: target_date ? new Date(target_date) : null,
          budget_range: normalizeBudgetRange(budget_range) as any,
          user_id: userId,
          lat: lat ? parseFloat(lat) : null,
          lng: lng ? parseFloat(lng) : null,
          // Location fields
          location: location || null,
          name: name || null,
          brgy: brgy || null,
          province: province || null,
          city: city || null
        }
      })
    );

    console.log("created activity successfully");
    res.status(201).json({ 
      message: "Activity created successfully",
      ...formatActivity(activity)
    });
  } catch (error) {
    console.error("Error creating activity:", error);
    return handlePrismaError(error, res, 'Creating activity');
  }
}

