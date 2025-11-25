import { prisma } from "../../src/lib/prisma.js";

export async function categories_fetch(req, res) {
  const { id } = req.params;

  try {
    const categories = await prisma.businessCategory.findMany({
      where: {
        business_id: parseInt(id)
      },
      include: {
        price_ranges: true
      }
    });

    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: error.message });
  }
}
