import { Activity } from "../../src/models/index.js";
import { executeWithRetry } from "../../src/lib/sequelize.js";
import { handleSequelizeError } from "../../src/lib/queryHelpers.js";

export async function delete_activity(req, res) {
  const { id } = req.params;
  console.log("deleting activity:", id);

  try {
    const activity = await executeWithRetry(() =>
      Activity.findByPk(parseInt(id))
    );

    if (!activity) {
      return res.status(404).json({ error: "Activity not found" });
    }

    await activity.destroy();

    res.status(200).json({ message: "Activity deleted successfully" });
  } catch (error) {
    console.error("Error deleting activity:", error);
    return handleSequelizeError(error, res, 'Deleting activity');
  }
}
