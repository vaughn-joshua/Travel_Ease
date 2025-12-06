import { prisma, executeWithRetry, handlePrismaError } from "../../../lib/prismaHelpers.js";
import { formatActivity } from "../utils/activityConstants.js";
import { Request, Response } from "express";

/**
 * Toggle the is_priority field on an activity
 * PATCH /travel_plan/activity/:id/priority
 */
export async function toggle_activity_priority(req: Request, res: Response) {
  const { id } = req.params;

  console.log("toggling priority for activity:", id);

  try {
    // First get current state
    const activity = await executeWithRetry(() =>
      prisma.activity.findUnique({
        where: { activity_id: parseInt(id) }
      })
    );

    if (!activity) {
      return res.status(404).json({ error: "Activity not found" });
    }

    // Toggle the priority
    const updatedActivity = await executeWithRetry(() =>
      prisma.activity.update({
        where: { activity_id: parseInt(id) },
        data: { is_priority: !activity.is_priority }
      })
    );

    console.log("toggled activity priority successfully:", updatedActivity.is_priority);
    res.json({ 
      message: "Activity priority toggled successfully", 
      activity: formatActivity(updatedActivity),
      is_priority: updatedActivity.is_priority
    });
  } catch (error) {
    console.error("Error toggling activity priority:", error);
    return handlePrismaError(error, res, 'Toggling activity priority');
  }
}

