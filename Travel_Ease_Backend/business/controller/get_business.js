import { prisma } from "../../src/lib/prisma.js";

export async function get_businesses(req, res) {
  try {
    const businesses = await prisma.business.findMany({
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

    console.log(businesses);
    res.status(200).json(businesses);
  } catch (error) {
    console.error("Error fetching businesses:", error);
    res.status(500).json({ error: error.message });
  }
}
