import { Router } from "express";
import { authenticateToken } from "../src/middleware/auth.js";
import { requireBusinessOwnership } from "../src/middleware/ownership.js";
import { 
  validate, 
  createBusinessSchema, 
  editBusinessSchema,
  priceRangeSchema
} from "../src/schemas/validation.js";
import { create_business } from "../business/index.js";
import { price_range } from "../business/index.js";
import { business_fetch } from "../business/index.js";
import { categories_fetch } from "../business/index.js";
import { edit_business } from "../business/index.js";
import { get_businesses } from "../business/index.js";
import { prisma } from "../src/lib/prisma.js";

const router = Router();

// Create routes (auth + validation)
router.post("/create_business", authenticateToken, validate(createBusinessSchema), create_business);
router.post("/price_range", authenticateToken, validate(priceRangeSchema), price_range);

// Public read routes
router.get("/fetch_business/:id", business_fetch);
router.get("/fetch_categories/:id", categories_fetch);
router.get("/businesses", get_businesses);

// Edit routes (auth + ownership + validation)
router.put("/edit_business/:id", authenticateToken, requireBusinessOwnership, validate(editBusinessSchema), edit_business);

// Travel spots endpoints (public for browsing)
router.get("/travel_spots", async (req, res) => {
  try {
    const businesses = await prisma.business.findMany({
      where: {
        status: true // Only show approved/active businesses
      },
      select: {
        business_id: true,
        user_id: true,
        name: true,
        house_number: true,
        street: true,
        brgy: true,
        city: true,
        latitude: true,
        longtitude: true,
        description: true,
        rating: true,
        status: true,
        picture: true
      },
      orderBy: {
        rating: 'desc'
      }
    });
    
    res.json({
      message: "Success",
      data: businesses,
    });
  } catch (error) {
    console.error("Error fetching travel spots:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

router.get("/travel_spots/reviews/:id", async (req, res) => {
  const businessId = parseInt(req.params.id);
  
  try {
    const reviews = await prisma.businessReview.findMany({
      where: {
        business_id: businessId
      },
      include: {
        user: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true
          }
        }
      },
      orderBy: {
        review_date: 'desc'
      }
    });
    
    res.json({
      message: "Success",
      data: reviews,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
}); 

export default router;
