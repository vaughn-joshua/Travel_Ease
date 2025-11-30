import { TravelPlan } from "../../src/models/index.js";
import { executeWithRetry } from "../../src/lib/sequelize.js";
import { handleSequelizeError } from "../../src/lib/queryHelpers.js";

export async function plans_id(req, res) {
  try {
    const { id } = req.params;

    const plan = await executeWithRetry(() =>
      TravelPlan.findByPk(parseInt(id), {
        attributes: [
          'travel_plan_id',
          'name',
          'user_id',
          'start_date',
          'end_date',
          'description',
          'location',
          'status',
          'max_slots',
          'visibility'
        ]
      })
    );

    if (!plan) {
      return res.status(404).json({ error: "Travel plan not found" });
    }

    // Transform to match frontend expectations
    const transformedPlan = {
      travel_plan_id: plan.travel_plan_id,
      title: plan.name, // Frontend expects 'title', backend uses 'name'
      name: plan.name,
      user_id: plan.user_id,
      start_date: plan.start_date,
      end_date: plan.end_date,
      description: plan.description,
      location: plan.location,
      status: plan.status,
      max_slots: plan.max_slots,
      slots: plan.max_slots, // Alias for frontend
      visibility: plan.visibility
    };

    console.log("successful fetch plan id");
    res.json(transformedPlan); // Return as single object, not array
  } catch (error) {
    console.error("Error fetching plan:", error);
    return handleSequelizeError(error, res, 'Fetching plan');
  }
}
