import { prisma, executeWithRetry, handlePrismaError } from "../../src/lib/prismaHelpers.js";
import { Request, Response } from "express";

// Valid status transitions: current status -> allowed next statuses
const STATUS_TRANSITIONS: Record<string, string[]> = {
  Draft: ['Active', 'Cancelled'],
  Active: ['Completed', 'Cancelled'],
  Completed: [], // Terminal state
  Cancelled: []  // Terminal state
};

/**
 * Validate if status transition is allowed
 */
function isValidTransition(currentStatus: string | null, newStatus: string | null): boolean {
  if (!currentStatus || !newStatus) return true;
  if (currentStatus === newStatus) return true;
  const allowed = STATUS_TRANSITIONS[currentStatus] || [];
  return allowed.includes(newStatus);
}

export async function plan_edit(req: Request, res: Response) {
  const { id } = req.params;
  const {
    description,
    name,
    title, // Accept both name and title for backward compat
    location,
    max_slots,
    start_date,
    end_date,
    visibility,
    status,
  } = req.body;

  const planId = parseInt(id);

  try {
    // Fetch current plan state with approved participant count
    const [currentPlan, approvedCount] = await executeWithRetry(() =>
      Promise.all([
        prisma.travelPlan.findUnique({
          where: { travel_plan_id: planId }
        }),
        prisma.participant.count({
          where: { travel_plan_id: planId, status: true }
        })
      ])
    );

    if (!currentPlan) {
      return res.status(404).json({ error: "Travel plan not found" });
    }

    // Validate status transition if status is being changed
    if (status && status !== currentPlan.status) {
      if (!isValidTransition(currentPlan.status, status)) {
        return res.status(400).json({
          error: "Invalid status transition",
          details: `Cannot transition from ${currentPlan.status} to ${status}. Allowed: ${STATUS_TRANSITIONS[currentPlan.status || '']?.join(', ') || 'none'}`
        });
      }
    }

    // Build update data
    const updateData: Record<string, any> = {};

    // Handle name/title (accept both, prefer name)
    const newName = name || title;
    if (newName !== undefined) updateData.name = newName;

    // Simple field updates
    if (description !== undefined) updateData.description = description;
    if (location !== undefined) updateData.location = location;
    
    // Validate max_slots against current approved participants
    if (max_slots !== undefined) {
      const newMaxSlots = max_slots === null ? null : parseInt(max_slots);
      if (newMaxSlots !== null && newMaxSlots < approvedCount) {
        return res.status(400).json({
          error: "Cannot reduce max_slots below current participant count",
          details: `Current approved participants: ${approvedCount}, requested max_slots: ${newMaxSlots}`
        });
      }
      updateData.max_slots = newMaxSlots;
    }
    
    // Validate date range
    const newStartDate = start_date !== undefined ? (start_date ? new Date(start_date) : null) : currentPlan.start_date;
    const newEndDate = end_date !== undefined ? (end_date ? new Date(end_date) : null) : currentPlan.end_date;
    
    if (newStartDate && newEndDate && newStartDate > newEndDate) {
      return res.status(400).json({
        error: "Invalid date range",
        details: "Start date must be before or equal to end date"
      });
    }
    
    if (start_date !== undefined) updateData.start_date = start_date ? new Date(start_date) : null;
    if (end_date !== undefined) updateData.end_date = end_date ? new Date(end_date) : null;

    // Status update with related changes
    if (status !== undefined) {
      updateData.status = status;
      
      // When completing or cancelling, turn off visibility
      if (status === 'Completed' || status === 'Cancelled') {
        updateData.visibility = false;
      }
    }

    // Visibility update with timestamp management
    if (visibility !== undefined) {
      updateData.visibility = visibility;
      
      // Set visibility_timestamp when making visible
      if (visibility === true && currentPlan.visibility === false) {
        updateData.visibility_timestamp = new Date();
      }
      // Clear visibility_timestamp when hiding
      if (visibility === false && currentPlan.visibility === true) {
        updateData.visibility_timestamp = null;
      }
    }

    // Perform update
    const updatedPlan = await executeWithRetry(() =>
      prisma.travelPlan.update({
        where: { travel_plan_id: parseInt(id) },
        data: updateData
      })
    );

    res.status(200).json({
      message: "Travel plan updated successfully",
      plan: {
        travel_plan_id: updatedPlan.travel_plan_id,
        name: updatedPlan.name,
        status: updatedPlan.status,
        visibility: updatedPlan.visibility,
        visibility_timestamp: updatedPlan.visibility_timestamp,
        start_date: updatedPlan.start_date,
        end_date: updatedPlan.end_date
      }
    });
  } catch (error) {
    console.error("Error editing plan:", error);
    return handlePrismaError(error, res, 'Editing plan');
  }
}

