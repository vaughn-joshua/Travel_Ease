import { prisma } from "../../src/lib/prisma.js";

/**
 * Bulk update activity dates for a travel plan
 * Supports two modes:
 * 1. Relative shift: { offset_ms: number } - shifts all dates by offset milliseconds
 * 2. New start date: { new_start_date: string } - recalculates based on new plan start
 */
export async function update_activity(req, res) {
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

    // Get the travel plan and its activities
    const plan = await prisma.travelPlan.findUnique({
      where: { travel_plan_id: parseInt(id) },
      select: {
        travel_plan_id: true,
        start_date: true,
        activities: {
          select: {
            activity_id: true,
            target_date: true
          }
        }
      }
    });

    if (!plan) {
      return res.status(404).json({ error: "Travel plan not found" });
    }

    if (plan.activities.length === 0) {
      return res.status(404).json({ error: "No activities found for this travel plan" });
    }

    // Calculate the offset to apply
    let shiftMs = offset;
    
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

    // Filter activities with dates and prepare updates
    const activitiesWithDates = plan.activities.filter(a => a.target_date !== null);
    
    if (activitiesWithDates.length === 0) {
      return res.status(200).json({
        message: "No activities with dates to update",
        updated: 0
      });
    }

    // Use transaction for atomic updates
    const updates = activitiesWithDates.map(activity => {
      const currentDate = new Date(activity.target_date);
      const newDate = new Date(currentDate.getTime() + shiftMs);
      
      return prisma.activity.update({
        where: { activity_id: activity.activity_id },
        data: { target_date: newDate }
      });
    });

    await prisma.$transaction(updates);

    res.status(200).json({
      message: "Activities updated successfully",
      updated: activitiesWithDates.length,
      offset_applied_ms: shiftMs
    });
  } catch (error) {
    console.error("Error updating activities:", error);
    res.status(500).json({ error: error.message });
  }
}
