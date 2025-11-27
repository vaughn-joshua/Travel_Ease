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

    res.status(200).json({ message: "Activity deleted successfully" });
  } catch (error) {
    console.error("Error deleting activity:", error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: "Activity not found" });
    }
    res.status(500).json({ error: error.message });
  }
}
