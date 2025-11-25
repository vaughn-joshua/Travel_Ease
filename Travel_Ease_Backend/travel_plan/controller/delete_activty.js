import { prisma } from "../../src/lib/prisma.js";

export async function delete_activity(req, res) {
  const { id } = req.params;
  console.log("deleting activity:", id);

  try {
    await prisma.activity.delete({
      where: {
        activity_id: parseInt(id)
      }
    });

    console.log("deleted activity successfully");
    res.status(201).json({ message: "deleted activity successfully" });
  } catch (error) {
    console.error("Error deleting activity:", error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: "Activity not found" });
    }
    res.status(500).json({ error: error.message });
  }
}
