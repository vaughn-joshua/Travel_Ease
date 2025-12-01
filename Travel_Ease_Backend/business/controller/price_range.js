import { prisma, handlePrismaError } from "../../src/lib/prismaHelpers.js";

export async function price_range(req, res) {
  const { categories, pictures, id } = req.body;

  console.log("creating range...");

  try {
    await prisma.$transaction(async (tx) => {
      // Create price ranges for categories
      if (categories && categories.length > 0) {
        await tx.priceRange.createMany({
          data: categories.map((cat) => ({
            category_id: cat.category_id,
            min_price: cat.min_price,
            max_price: cat.max_price,
          }))
        });
      }

      // Update business pictures
      if (pictures && id) {
        await tx.business.update({
          where: { business_id: parseInt(id) },
          data: { picture: pictures }
        });
      }
    });

    res.json({ message: "successfully input price_range/s" });
  } catch (error) {
    console.error("Error creating price range:", error);
    return handlePrismaError(error, res, 'Creating price range');
  }
}
