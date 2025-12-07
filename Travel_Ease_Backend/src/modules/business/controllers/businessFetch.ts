import { prisma, executeWithRetry, handlePrismaError } from "../../../lib/prismaHelpers.js";
import { Request, Response } from "express";
import { formatBusinessToDTO } from "../../../services/businessService.js";

export async function business_fetch(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const business = await executeWithRetry(() =>
      prisma.business.findUnique({
        where: { business_id: parseInt(id) },
        include: {
          business_category: {
            select: {
              category_id: true,
            }
          },
          business_hours: true,
          menu_item: {
            where: { is_available: true },
            orderBy: [{ category: 'asc' }, { name: 'asc' }]
          },
          business_review: {
            take: 5,
            orderBy: { review_date: 'desc' },
            include: {
              user: {
                select: {
                  user_id: true,
                  first_name: true,
                  last_name: true
                }
              }
            }
          },
          user: {
            select: {
              user_id: true,
              first_name: true,
              last_name: true,
              email: true
            }
          }
        }
      })
    );

    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    res.json(formatBusinessToDTO(business));
  } catch (error) {
    console.error("Error fetching business:", error);
    return handlePrismaError(error, res, 'Fetching business');
  }
}

