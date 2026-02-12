import { Router, Request, Response } from "express";
import { prisma } from "../lib/prismaHelpers.js";
import { businessLogger } from "../lib/logger.js";
import { authenticateToken } from "../middleware/auth.js";
import { z } from "zod";

const router = Router();

// LGU Admin user ID
const LGU_ADMIN_ID = parseInt(process.env.LGU_ADMIN_ID || '7210', 10);

/**
 * Search for matching businesses by name (case-insensitive)
 * Returns all LGU-owned businesses that match the name
 * 
 * Query: name (required), city (optional), brgy (optional), street (optional)
 * 
 * Used by frontend to show matching businesses before registration
 */
router.post("/search-matches", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { name, city, brgy, street } = req.body;

    // Validate input
    if (!name || typeof name !== "string") {
      return res.status(400).json({
        error: "Business name is required",
        code: "INVALID_INPUT"
      });
    }

    const searchName = name.trim();
    
    businessLogger.debug(
      { searchName, city, brgy, street, userId: req.user?.id },
      "Searching for matching businesses"
    );

    // Search for businesses matching the name (case-insensitive)
    // Only return LGU-owned businesses (user_id = LGU_ADMIN_ID)
    const matches = await prisma.business.findMany({
      where: {
        user_id: LGU_ADMIN_ID,
        name: {
          equals: searchName,
          mode: 'insensitive'
        }
        // Note: city, brgy, street filtering removed - name match alone is sufficient
        // This makes the modal more helpful and easier to use
      },
      select: {
        business_id: true,
        name: true,
        city: true,
        brgy: true,
        street: true,
        house_number: true,
        latitude: true,
        longtitude: true,
        picture: true,
        rating: true,
        description: true,
        status: true
      },
      orderBy: {
        business_id: 'asc'
      }
    })

    businessLogger.debug(
      { searchName, matchCount: matches.length, userId: req.user?.id },
      "Business search completed"
    );

    // Return all matches - let frontend/user pick the best one
    return res.status(200).json({
      matches: matches,
      count: matches.length
    });

  } catch (error) {
    businessLogger.error(
      { error: error instanceof Error ? error.message : String(error), userId: req.user?.id },
      "Error in search-matches"
    );
    return res.status(500).json({
      error: "Error searching for businesses",
      code: "SEARCH_ERROR"
    });
  }
});

export default router;
