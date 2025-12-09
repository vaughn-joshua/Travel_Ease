import { prisma, handlePrismaError } from "../../../lib/prismaHelpers.js";
import { Request, Response } from "express";

export async function price_range(req: Request, res: Response) {
  const { categories, pictures, id } = req.body;

  console.log("creating range...");

  try {
    await prisma.$transaction(async (tx) => {
      // Create price ranges for subcategories
      if (categories && categories.length > 0) {
        await tx.price_range.createMany({
          data: categories.map((cat: { subcategory_id: number; min_price: number; max_price: number }) => ({
            subcategory_id: cat.subcategory_id,
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

