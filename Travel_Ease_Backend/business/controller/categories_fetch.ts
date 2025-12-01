import { prisma, executeWithRetry, handlePrismaError } from "../../src/lib/prismaHelpers.js";
import { Request, Response } from "express";

export async function categories_fetch(req: Request, res: Response) {
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

