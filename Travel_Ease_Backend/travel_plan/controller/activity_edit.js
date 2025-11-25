import { prisma } from "../../src/lib/prisma.js";

export async function activity_edit(req, res) {
  const { id } = req.params;
  const { budget_range, is_priority, notes, target_date } = req.body;

  console.log("editing...");
  console.log(id);
  console.log({ budget_range, is_priority, notes, target_date });

  try {
    const activity = await prisma.activity.update({
      where: {
        activity_id: parseInt(id)
      },
      data: {
        budget_range,
        is_priority,
        notes,
        target_date: target_date ? new Date(target_date) : null
      }
    });

    console.log("edited activity successfully");
    res.status(201).json({ message: "you edited the activity successfully" });
  } catch (error) {
    console.error("Error editing activity:", error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: "Activity not found" });
    }
    res.status(500).json({ error: error.message });
  }
}
