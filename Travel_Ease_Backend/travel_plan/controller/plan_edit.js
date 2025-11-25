import { prisma } from "../../src/lib/prisma.js";

export async function plan_edit(req, res) {
  const { id } = req.params;
  const {
    description,
    name,
    location,
    max_slots,
    start_date,
    end_date,
    visibility,
    status,
  } = req.body;

  console.log("editing...");
  console.log(req.body);

  try {
    if (status) {
      // Simple status update
      const updated = await prisma.travelPlan.update({
        where: {
          travel_plan_id: parseInt(id)
        },
        data: {
          status
        }
      });

      console.log("travel plan status updated");
      res.status(201).json({ message: "travel plan status updated" });
    } else {
      // Full plan edit
      const currentPlan = await prisma.travelPlan.findUnique({
        where: { travel_plan_id: parseInt(id) }
      });

      const updated = await prisma.travelPlan.update({
        where: {
          travel_plan_id: parseInt(id)
        },
        data: {
          description,
          name,
          location,
          max_slots,
          start_date: start_date ? new Date(start_date) : undefined,
          end_date: end_date ? new Date(end_date) : undefined,
          visibility,
          // Set visibility_timestamp if visibility changes from false to true
          ...(visibility === true && currentPlan?.visibility === false && {
            visibility_timestamp: new Date()
          })
        }
      });

      console.log("edited plan successfully");
      res.status(201).json({ message: "you edited the plan successfully" });
    }
  } catch (error) {
    console.error("Error editing plan:", error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: "Travel plan not found" });
    }
    res.status(500).json({ error: error.message });
  }
}
