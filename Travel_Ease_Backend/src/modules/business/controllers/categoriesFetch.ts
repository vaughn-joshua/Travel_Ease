import { prisma, executeWithRetry, handlePrismaError } from "../../../lib/prismaHelpers.js";
import { Request, Response } from "express";

export async function categories_fetch(req: Request, res: Response) {
  const { id } = req.params;

  try {
    // Fetch categories and business price info
    const [categories, business] = await executeWithRetry(() =>
      Promise.all([
        prisma.business_category.findMany({
          where: { business_id: parseInt(id) },
          select: {
            category_id: true,
            subcategory_id: true,
            subcategory: {
              select: {
                subcategory_name: true,
                main_category: true,
              }
            }
          }
        }),
        prisma.business.findUnique({
          where: { business_id: parseInt(id) },
          select: { min_price: true, max_price: true }
        })
      ])
    );

    // Return categories with business-level price range
    res.json({
      categories,
      priceRange: business?.min_price != null && business?.max_price != null
        ? { min: business.min_price, max: business.max_price }
        : null
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return handlePrismaError(error, res, 'Fetching categories');
  }
}

