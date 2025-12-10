import { prisma, executeWithRetry, handlePrismaError } from "../../../lib/prismaHelpers.js";
import { formatActivities } from "../utils/activityConstants.js";
import { cacheResult, buildCacheKey } from "../../../lib/cache.js";
import { Request, Response } from "express";

// Cache TTL for activities (30 seconds)
const CACHE_TTL_ACTIVITIES = 30;

export async function fetch_activities(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const planId = parseInt(id);

    // Use caching for activities
    const { data: activities, fromCache, cacheBackend } = await cacheResult({
      key: buildCacheKey('activities', 'plan', planId),
      ttl: CACHE_TTL_ACTIVITIES,
      fetchFn: async () => {
        return executeWithRetry(() =>
          prisma.activity.findMany({
            where: { 
              travel_plan_id: planId,
              is_accommodation: { not: true } // Exclude accommodation activities
            },
            include: {
              user: {
                select: {
                  user_id: true,
                  first_name: true,
                  last_name: true
                }
              },
              business: {
                select: {
                  business_id: true,
                  name: true,
                  latitude: true,
                  longtitude: true // Note: DB column has typo
                }
              }
            },
            orderBy: [
              { target_date: 'asc' },
              { activity_id: 'asc' }
            ]
          })
        );
      }
    });

    // Set cache header for debugging
    res.set("X-Cache", fromCache ? `HIT:${cacheBackend}` : 'MISS');
    
    // Use shared formatter for consistent DTO shape
    res.json(formatActivities(activities));
  } catch (error) {
    return handlePrismaError(error, res, 'Fetching activities');
  }
}

