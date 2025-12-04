import { prisma, executeWithRetry, handlePrismaError } from "../../../lib/prismaHelpers.js";
import { normalizeBudgetRange, formatActivity } from "../utils/activityConstants.js";
import { Request, Response } from "express";

export async function activity_edit(req: Request, res: Response) {
  const { id } = req.params;
  const { budget_range, is_priority, notes, target_date } = req.body;

  console.log("editing activity:", id);

  try {
    const activity = await executeWithRetry(() =>
      prisma.activity.findUnique({
        where: { activity_id: parseInt(id) }
      })
    );

    if (!activity) {
      return res.status(404).json({ error: "Activity not found" });
    }

    // Build update object with only provided fields
    const updateData: Record<string, any> = {};
    if (budget_range !== undefined) {
      updateData.budget_range = normalizeBudgetRange(budget_range);
    }
    if (is_priority !== undefined) {
      updateData.is_priority = is_priority;
    }
    if (notes !== undefined) {
      updateData.notes = notes;
    }
    if (target_date !== undefined) {
      updateData.target_date = target_date ? new Date(target_date) : null;
    }

    const updatedActivity = await executeWithRetry(() =>
      prisma.activity.update({
        where: { activity_id: parseInt(id) },
        data: updateData
      })
    );

    console.log("edited activity successfully");
    res.json({ 
      message: "Activity updated successfully", 
      activity: formatActivity(updatedActivity) 
    });
  } catch (error) {
    console.error("Error editing activity:", error);
    return handlePrismaError(error, res, 'Editing activity');
  }
}

