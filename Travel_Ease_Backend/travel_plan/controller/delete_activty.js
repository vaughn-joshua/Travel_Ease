import { prisma, executeWithRetry, handlePrismaError } from "../../src/lib/prismaHelpers.js";

export async function delete_activity(req, res) {
  const { id } = req.params;
  console.log("deleting activity:", id);

  try {
    const activity = await executeWithRetry(() =>
      prisma.activity.findUnique({
        where: { activity_id: parseInt(id) }
      })
    );

    if (!activity) {
      return res.status(404).json({ error: "Activity not found" });
    }

    await executeWithRetry(() =>
      prisma.activity.delete({
        where: { activity_id: parseInt(id) }
      })
    );

    res.status(200).json({ message: "Activity deleted successfully" });
  } catch (error) {
    console.error("Error deleting activity:", error);
    return handlePrismaError(error, res, 'Deleting activity');
  }
}
