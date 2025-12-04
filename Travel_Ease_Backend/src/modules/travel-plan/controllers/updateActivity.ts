import { prisma, executeWithRetry, handlePrismaError } from "../../../lib/prismaHelpers.js";
import { Request, Response } from "express";

/**
 * Bulk update activity dates for a travel plan
 * Supports two modes:
 * 1. Relative shift: { offset_ms: number } - shifts all dates by offset milliseconds
 * 2. New start date: { new_start_date: string } - recalculates based on new plan start
 */
export async function update_activity(req: Request, res: Response) {
  const { id } = req.params;
  const { start, offset_ms, new_start_date } = req.body;

  // Support legacy 'start' param as alias for offset_ms
  const offset = offset_ms !== undefined ? Number(offset_ms) : (start !== undefined ? Number(start) : null);

  try {
    // Validate input
    if (offset === null && !new_start_date) {
      return res.status(400).json({
        error: "Missing required parameter",
        details: "Provide either offset_ms (milliseconds to shift) or new_start_date"
      });
    }

    const planId = parseInt(id);

    // Get the travel plan
    const plan = await executeWithRetry(() =>
      prisma.travelPlan.findUnique({
        where: { travel_plan_id: planId },
        select: { travel_plan_id: true, start_date: true }
      })
    );

    if (!plan) {
      return res.status(404).json({ error: "Travel plan not found" });
    }

    // Get activities with dates
    const activities = await executeWithRetry(() =>
      prisma.activity.findMany({
        where: { travel_plan_id: planId },
        select: { activity_id: true, target_date: true }
      })
    );

    if (activities.length === 0) {
      return res.status(404).json({ error: "No activities found for this travel plan" });
    }

    // Calculate the offset to apply
    let shiftMs: number | null = offset;
    
    if (new_start_date && plan.start_date) {
      // Calculate offset based on difference between new and old start dates
      const oldStart = new Date(plan.start_date).getTime();
      const newStart = new Date(new_start_date).getTime();
      shiftMs = newStart - oldStart;
    }

    if (shiftMs === null || isNaN(shiftMs)) {
      return res.status(400).json({
        error: "Invalid offset",
        details: "Could not calculate date shift. Ensure dates are valid."
      });
    }

    // Filter activities with dates
    const activitiesWithDates = activities.filter(a => a.target_date !== null);
    
    if (activitiesWithDates.length === 0) {
      return res.status(200).json({
        message: "No activities with dates to update",
        updated: 0
      });
    }

    // Use transaction for atomic updates
    await prisma.$transaction(
      activitiesWithDates.map(activity => {
        const currentDate = new Date(activity.target_date!);
        const newDate = new Date(currentDate.getTime() + shiftMs!);
        
        return prisma.activity.update({
          where: { activity_id: activity.activity_id },
          data: { target_date: newDate }
        });
      })
    );

    res.status(200).json({
      message: "Activities updated successfully",
      updated: activitiesWithDates.length,
      offset_applied_ms: shiftMs
    });
  } catch (error) {
    console.error("Error updating activities:", error);
    return handlePrismaError(error, res, 'Updating activities');
  }
}

