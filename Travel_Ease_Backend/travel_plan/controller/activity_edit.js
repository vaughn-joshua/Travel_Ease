import { Activity } from "../../src/models/index.js";
import { executeWithRetry } from "../../src/lib/sequelize.js";
import { handleSequelizeError } from "../../src/lib/queryHelpers.js";

export async function activity_edit(req, res) {
  const { id } = req.params;
  const { budget_range, is_priority, notes, target_date } = req.body;

  console.log("editing...");
  console.log(id);
  console.log({ budget_range, is_priority, notes, target_date });

  try {
    const activity = await executeWithRetry(() =>
      Activity.findByPk(parseInt(id))
    );

    if (!activity) {
      return res.status(404).json({ error: "Activity not found" });
    }

    await activity.update({
      budget_range,
      is_priority,
      notes,
      target_date: target_date ? new Date(target_date) : null
    });

    console.log("edited activity successfully");
    res.json({ message: "Activity updated successfully", activity });
  } catch (error) {
    console.error("Error editing activity:", error);
    return handleSequelizeError(error, res, 'Editing activity');
  }
}
