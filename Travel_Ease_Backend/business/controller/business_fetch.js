import { prisma } from "../../src/lib/prisma.js";

export async function business_fetch(req, res) {
  const { id } = req.params;

  try {
    const business = await prisma.business.findUnique({
      where: {
        business_id: parseInt(id)
      },
      include: {
        categories: true,
        business_hours: true,
        user: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        }
      }
    });

    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    res.json(business);
  } catch (error) {
    console.error("Error fetching business:", error);
    res.status(500).json({ error: error.message });
  }
}
