import { prisma, executeWithRetry, handlePrismaError } from "../../src/lib/prismaHelpers.js";

export async function categories_fetch(req, res) {
  const { id } = req.params;

  try {
    const categories = await executeWithRetry(() =>
      prisma.businessCategory.findMany({
        where: { business_id: parseInt(id) },
        include: {
          price_ranges: true
        }
      })
    );

    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return handlePrismaError(error, res, 'Fetching categories');
  }
}
