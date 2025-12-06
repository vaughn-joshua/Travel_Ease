/**
 * Helper function to fetch accommodation for one or more travel plans
 */
import { prisma, executeWithRetry } from "../../../lib/prismaHelpers.js";

export async function getAccommodationForPlans(
  planIds: number[]
): Promise<Map<number, { business_id: number; name: string } | null>> {
  if (planIds.length === 0) {
    return new Map();
  }

  const accommodations = await executeWithRetry(() =>
    prisma.activity.findMany({
      where: {
        travel_plan_id: { in: planIds },
        is_accommodation: true
      },
      select: {
        travel_plan_id: true,
        business_id: true,
        business: {
          select: {
            business_id: true,
            name: true
          }
        }
      }
    })
  );

  const accommodationMap = new Map<number, { business_id: number; name: string } | null>();
  
  // Initialize all plans with null
  planIds.forEach(id => accommodationMap.set(id, null));
  
  // Set accommodation for plans that have it
  accommodations.forEach(acc => {
    if (acc.business) {
      accommodationMap.set(acc.travel_plan_id, {
        business_id: acc.business.business_id,
        name: acc.business.name
      });
    }
  });

  return accommodationMap;
}

