import { prisma, executeWithRetry, handlePrismaError } from "../../../lib/prismaHelpers.js";
import { formatActivities } from "../utils/activityConstants.js";
import { Request, Response } from "express";

export async function fetch_activities(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const activities = await executeWithRetry(() =>
      prisma.activity.findMany({
        where: { travel_plan_id: parseInt(id) },
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
              longtitude: true
            }
          }
        },
        orderBy: [
          { target_date: 'asc' },
          { activity_id: 'asc' }
        ]
      })
    );

    // Use shared formatter for consistent DTO shape
    res.json(formatActivities(activities));
  } catch (error) {
    console.error("Error fetching activities:", error);
    return handlePrismaError(error, res, 'Fetching activities');
  }
}

