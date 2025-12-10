import { prisma, executeWithRetry, handlePrismaError } from "../../../lib/prismaHelpers.js";
import { normalizeBudgetRange, formatActivity } from "../utils/activityConstants.js";
import { invalidateCachePattern } from "../../../lib/cache.js";
import { Request, Response } from "express";

// Valid range enum values as strings (Prisma accepts string values for enums)
const VALID_RANGE_VALUES = [
  'RANGE_0_100',
  'RANGE_100_200',
  'RANGE_200_400',
  'RANGE_400_700',
  'RANGE_700_1000',
  'RANGE_1000_1500',
  'RANGE_1500_PLUS',
] as const;

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
          select: { latitude: true, longtitude: true }, // Note: DB column has typo 'longtitude'
        })
      );

      if (business && business.latitude != null && business.longtitude != null) {
        // Use business coordinates when business_id is provided (from suggested businesses)
        finalLat = Number(business.latitude);
        finalLng = Number(business.longtitude); // Note: DB column has typo 'longtitude'
      }
    }

    // Validate coordinates are valid (allow null/undefined for activities without coordinates)
    if (finalLat != null && (isNaN(finalLat) || finalLat === 0)) finalLat = null;
    if (finalLng != null && (isNaN(finalLng) || finalLng === 0)) finalLng = null;

    // Normalize budget_range - ensure it's a valid enum value or null
    const normalizedBudgetRange = normalizeBudgetRange(budget_range);
    
    const activityData: any = {
          travel_plan_id: parseInt(travel_plan_id),
          business_id: business_id ? parseInt(String(business_id)) : null,
          target_date: target_date ? new Date(target_date) : null,
          user_id: userId,
          lat: finalLat,
          lng: finalLng,
          // Location fields
          location: location || null,
          name: name || null,
          brgy: brgy || null,
          province: province || null,
          city: city || null
    };
    
    // Only include notes if it's provided (not undefined)
    if (notes !== undefined && notes !== null) {
      activityData.notes = notes;
    }
    
    // Only include budget_range if it's a valid enum value
    // Prisma accepts string values for enums at runtime
    if (normalizedBudgetRange) {
      // Validate that the string is a valid enum value
      if (VALID_RANGE_VALUES.includes(normalizedBudgetRange as typeof VALID_RANGE_VALUES[number])) {
        activityData.budget_range = normalizedBudgetRange;
      }
    }

    const activity = await executeWithRetry(() =>
      prisma.activity.create({
        data: activityData
      })
    );

    // Invalidate activities cache for this plan
    await invalidateCachePattern(`activities:plan:${travel_plan_id}`);

    const formattedActivity = formatActivity(activity);
    
    res.status(201).json({ 
      message: "Activity created successfully",
      ...formattedActivity
    });
  } catch (error) {
    return handlePrismaError(error, res, 'Creating activity');
  }
}

