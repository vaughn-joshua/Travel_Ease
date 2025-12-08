import { prisma, executeWithRetry, handlePrismaError } from "../../../lib/prismaHelpers.js";
import { normalizeBudgetRange, formatActivity } from "../utils/activityConstants.js";
import { Request, Response } from "express";
import { range } from "@prisma/client";

export async function create_activity(req: Request, res: Response) {
  console.log('[create_activity] ========== CREATE ACTIVITY REQUEST ==========');
  console.log('[create_activity] Request body:', JSON.stringify(req.body, null, 2));
  console.log('[create_activity] User from request:', req.user);
  
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

  console.log('[create_activity] Extracted values:', {
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
    business_id
  });

  // Use authenticated user ID from middleware
  const userId = req.user!.id;
  console.log('[create_activity] User ID:', userId);

  try {
    // Parse coordinates from request
    let finalLat = lat ? parseFloat(String(lat)) : null;
    let finalLng = lng ? parseFloat(String(lng)) : null;
    console.log('[create_activity] Initial coordinates:', { finalLat, finalLng });

    // If business_id is provided, fetch business coordinates
    // Use business coordinates if they exist (they should be more accurate)
    if (business_id) {
      console.log('[create_activity] Fetching business coordinates for business_id:', business_id);
      const business = await executeWithRetry(() =>
        prisma.business.findUnique({
          where: { business_id: parseInt(String(business_id)) },
          select: { latitude: true, longtitude: true }, // Note: DB column has typo 'longtitude'
        })
      );

      console.log('[create_activity] Business found:', business);

      if (business && business.latitude != null && business.longtitude != null) {
        // Use business coordinates when business_id is provided (from suggested businesses)
        finalLat = Number(business.latitude);
        finalLng = Number(business.longtitude); // Note: DB column has typo 'longtitude'
        console.log('[create_activity] Using business coordinates:', { finalLat, finalLng });
      } else {
        // Business doesn't have coordinates - use provided coordinates if available
        // If no coordinates provided, activity can still be created without coordinates
        console.log('[create_activity] Business has no coordinates, using provided coordinates (if any)');
        if (!finalLat || !finalLng) {
          console.log('[create_activity] No coordinates available - activity will be created without coordinates');
        }
      }
    }

    // Validate coordinates are valid (allow null/undefined for activities without coordinates)
    if (finalLat != null && (isNaN(finalLat) || finalLat === 0)) finalLat = null;
    if (finalLng != null && (isNaN(finalLng) || finalLng === 0)) finalLng = null;
    
    // Note: Activities can be created without coordinates if business_id is provided
    // The coordinates are optional and can be added later
    console.log('[create_activity] Final coordinates after validation:', { finalLat, finalLng });

    // Normalize budget_range - ensure it's a valid enum value or null
    const normalizedBudgetRange = normalizeBudgetRange(budget_range);
    console.log('[create_activity] Budget range normalization:', { input: budget_range, output: normalizedBudgetRange });
    
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
    // Prisma accepts enum values as the enum type or as strings matching the enum value
    if (normalizedBudgetRange) {
      // Map string to enum value
      const enumMap: Record<string, range> = {
        'RANGE_0_100': range.RANGE_0_100,
        'RANGE_100_200': range.RANGE_100_200,
        'RANGE_200_400': range.RANGE_200_400,
        'RANGE_400_700': range.RANGE_400_700,
        'RANGE_700_1000': range.RANGE_700_1000,
        'RANGE_1000_1500': range.RANGE_1000_1500,
        'RANGE_1500_PLUS': range.RANGE_1500_PLUS,
      };
      
      const enumValue = enumMap[normalizedBudgetRange];
      if (enumValue) {
        activityData.budget_range = enumValue;
        console.log('[create_activity] Using enum value:', enumValue, 'from string:', normalizedBudgetRange);
      } else {
        console.error('[create_activity] ❌ Invalid budget_range value:', normalizedBudgetRange);
        // Don't include budget_range if invalid
      }
    }
    
    console.log('[create_activity] Activity data to create:', JSON.stringify(activityData, null, 2));

    const activity = await executeWithRetry(() =>
      prisma.activity.create({
        data: activityData
      })
    );

    console.log('[create_activity] ✅ SUCCESS - Activity created with ID:', activity.activity_id);
    const formattedActivity = formatActivity(activity);
    console.log('[create_activity] Formatted activity:', JSON.stringify(formattedActivity, null, 2));
    
    res.status(201).json({ 
      message: "Activity created successfully",
      ...formattedActivity
    });
  } catch (error) {
    console.error('[create_activity] ❌ ERROR - Full error:', error);
    console.error('[create_activity] Error stack:', error instanceof Error ? error.stack : 'No stack');
    return handlePrismaError(error, res, 'Creating activity');
  }
}

