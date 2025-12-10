import { prisma, executeWithRetry, handlePrismaError } from "../../../lib/prismaHelpers.js";
import { invalidateCachePattern } from "../../../lib/cache.js";
import { Request, Response } from "express";

export async function delete_activity(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const activity = await executeWithRetry(() =>
      prisma.activity.findUnique({
        where: { activity_id: parseInt(id) }
      })
    );

    if (!activity) {
      return res.status(404).json({ error: "Activity not found" });
    }

    await executeWithRetry(() =>
      prisma.activity.delete({
        where: { activity_id: parseInt(id) }
      })
    );

    // Invalidate activities cache for this plan
    if (activity.travel_plan_id) {
      await invalidateCachePattern(`activities:plan:${activity.travel_plan_id}`);
    }

    res.status(200).json({ message: "Activity deleted successfully" });
  } catch (error) {
    return handlePrismaError(error, res, 'Deleting activity');
  }
}

