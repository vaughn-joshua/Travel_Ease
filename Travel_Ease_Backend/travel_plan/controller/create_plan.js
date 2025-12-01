import { TravelPlan, Participant } from "../../src/models/index.js";
import { sequelize, executeWithRetry } from "../../src/lib/sequelize.js";
import { handleSequelizeError } from "../../src/lib/queryHelpers.js";
import { formatPlan } from "../util/formatPlan.js";

export async function create_plan(req, res) {
  const {
    title,
    description,
    location,
    start_date,
    end_date,
    slots,
    max_slots: maxSlotsParam,
    collaborators,
  } = req.body;
  
  const userId = req.user.id;
  // Prefer max_slots, fallback to slots
  const maxSlots = maxSlotsParam ?? slots ?? null;

  try {
    const result = await sequelize.transaction(async (t) => {
      // Create travel plan
      const travelPlan = await TravelPlan.create({
        name: title,
        user_id: userId,
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
        description,
        max_slots: maxSlots,
        location,
        status: 'Draft'
      }, { transaction: t });

      // Add creator as Admin participant (always approved)
      await Participant.create({
        travel_plan_id: travelPlan.travel_plan_id,
        user_id: userId,
        role: 'Admin',
        status: true
      }, { transaction: t });

      // Add collaborators with slot enforcement for approved ones
      if (collaborators?.length > 0) {
        let approvedCount = 1; // Creator counts as 1 approved
        
        for (const collab of collaborators) {
          // Skip if no user_id or same as creator
          if (!collab.user_id || collab.user_id === userId) continue;
          
          const wantsApproved = collab.status === true;
          
          // Skip approved collaborators if would exceed max_slots
          if (wantsApproved && maxSlots && approvedCount >= maxSlots) continue;
          
          await Participant.create({
            travel_plan_id: travelPlan.travel_plan_id,
            user_id: collab.user_id,
            role: collab.role || 'Viewer',
            status: wantsApproved
          }, { transaction: t });
          
          if (wantsApproved) approvedCount++;
        }
      }

      return travelPlan;
    });

    res.status(201).json({ 
      message: "Travel plan created successfully",
      ...formatPlan(result)
    });
  } catch (error) {
    console.error("Error creating travel plan:", error);
    return handleSequelizeError(error, res, 'Creating travel plan');
  }
}
