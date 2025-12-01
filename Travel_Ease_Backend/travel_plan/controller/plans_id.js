import { TravelPlan } from "../../src/models/index.js";
import { executeWithRetry } from "../../src/lib/sequelize.js";
import { handleSequelizeError } from "../../src/lib/queryHelpers.js";
import { formatPlan } from "../util/formatPlan.js";

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

    console.log("successful fetch plan id");
    res.json(formatPlan(plan)); // Return as single object with normalized DTO
  } catch (error) {
    console.error("Error fetching plan:", error);
    return handleSequelizeError(error, res, 'Fetching plan');
  }
}
