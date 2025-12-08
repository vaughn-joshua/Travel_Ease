import { prisma, executeWithRetry, handlePrismaError } from "../../../lib/prismaHelpers.js";
import { normalizeBudgetRange, formatActivity } from "../utils/activityConstants.js";
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
    business_id,
  } = req.body;

  // Use authenticated user ID from middleware
  const userId = req.user!.id;

  try {
    // Parse coordinates from request
    let finalLat = lat ? parseFloat(String(lat)) : null;
    let finalLng = lng ? parseFloat(String(lng)) : null;

    // If business_id is provided, fetch business coordinates
    // Use business coordinates if they exist (they should be more accurate)
    if (business_id) {
      const business = await executeWithRetry(() =>
        prisma.business.findUnique({
          where: { business_id: parseInt(String(business_id)) },
          select: { latitude: true, longitude: true },
        })
      );

      if (business && business.latitude != null && business.longitude != null) {
        // Use business coordinates when business_id is provided (from suggested businesses)
        finalLat = Number(business.latitude);
        finalLng = Number(business.longitude);
      } else if (!finalLat || !finalLng) {
        // Fallback: use provided coordinates if business doesn't have coordinates
        // This handles cases where business_id is provided but business has no coordinates
      }
    }

    // Validate coordinates are valid
    if (finalLat != null && (isNaN(finalLat) || finalLat === 0)) finalLat = null;
    if (finalLng != null && (isNaN(finalLng) || finalLng === 0)) finalLng = null;

    const activity = await executeWithRetry(() =>
      prisma.activity.create({
        data: {
          travel_plan_id: parseInt(travel_plan_id),
          business_id: business_id ? parseInt(String(business_id)) : null,
          notes,
          target_date: target_date ? new Date(target_date) : null,
          budget_range: normalizeBudgetRange(budget_range) as any,
          user_id: userId,
          lat: finalLat,
          lng: finalLng,
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

