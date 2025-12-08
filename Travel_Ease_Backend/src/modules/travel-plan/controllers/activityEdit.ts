import { prisma, executeWithRetry, handlePrismaError } from "../../../lib/prismaHelpers.js";
import { normalizeBudgetRange, formatActivity } from "../utils/activityConstants.js";
import { Request, Response } from "express";

export async function activity_edit(req: Request, res: Response) {
  console.log('[activity_edit] ========== EDIT ACTIVITY REQUEST ==========');
  console.log('[activity_edit] Activity ID from params:', req.params.id);
  console.log('[activity_edit] Request body:', JSON.stringify(req.body, null, 2));
  console.log('[activity_edit] User from request:', req.user);
  
  const { id } = req.params;
  const { budget_range, is_priority, notes, target_date } = req.body;

  try {
    const activityId = parseInt(id);
    console.log('[activity_edit] Parsed activity ID:', activityId);
    
    const activity = await executeWithRetry(() =>
      prisma.activity.findUnique({
        where: { activity_id: activityId }
      })
    );

    console.log('[activity_edit] Found activity:', activity ? 'Yes' : 'No');
    if (activity) {
      console.log('[activity_edit] Current activity data:', {
        activity_id: activity.activity_id,
        travel_plan_id: activity.travel_plan_id,
        budget_range: activity.budget_range,
        is_priority: activity.is_priority,
        notes: activity.notes,
        target_date: activity.target_date
      });
    }

    if (!activity) {
      console.error('[activity_edit] ❌ ERROR: Activity not found');
      return res.status(404).json({ error: "Activity not found" });
    }

    // Build update object with only provided fields
    const updateData: Record<string, any> = {};
    if (budget_range !== undefined) {
      const normalized = normalizeBudgetRange(budget_range);
      updateData.budget_range = normalized;
      console.log('[activity_edit] Budget range update:', { input: budget_range, normalized });
    }
    if (is_priority !== undefined) {
      updateData.is_priority = is_priority;
      console.log('[activity_edit] Is priority update:', is_priority);
    }
    if (notes !== undefined) {
      updateData.notes = notes;
      console.log('[activity_edit] Notes update:', notes);
    }
    if (target_date !== undefined) {
      updateData.target_date = target_date ? new Date(target_date) : null;
      console.log('[activity_edit] Target date update:', { input: target_date, parsed: updateData.target_date });
    }

    console.log('[activity_edit] Update data to apply:', JSON.stringify(updateData, null, 2));

    const updatedActivity = await executeWithRetry(() =>
      prisma.activity.update({
        where: { activity_id: activityId },
        data: updateData
      })
    );

    console.log('[activity_edit] ✅ SUCCESS - Activity updated');
    console.log('[activity_edit] Updated activity data:', {
      activity_id: updatedActivity.activity_id,
      budget_range: updatedActivity.budget_range,
      is_priority: updatedActivity.is_priority,
      notes: updatedActivity.notes,
      target_date: updatedActivity.target_date
    });
    
    const formattedActivity = formatActivity(updatedActivity);
    console.log('[activity_edit] Formatted activity:', JSON.stringify(formattedActivity, null, 2));
    
    res.json({ 
      message: "Activity updated successfully", 
      activity: formattedActivity
    });
  } catch (error) {
    console.error('[activity_edit] ❌ ERROR - Full error:', error);
    console.error('[activity_edit] Error stack:', error instanceof Error ? error.stack : 'No stack');
    return handlePrismaError(error, res, 'Editing activity');
  }
}

