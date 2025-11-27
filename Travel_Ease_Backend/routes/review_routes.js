import { Router } from "express";
import { authenticateToken } from "../src/middleware/auth.js";
import { validate } from "../src/schemas/validation.js";
import { createReviewSchema } from "../src/schemas/validation.js";
import { prisma } from "../src/lib/prisma.js";

const router = Router();

// Create a business review
router.post("/business", authenticateToken, validate(createReviewSchema), async (req, res) => {
  try {
    const { business_id, rating, content } = req.body;
    const user_id = req.user.id;

    if (!business_id) {
      return res.status(400).json({ error: "business_id is required" });
    }

    // Check if business exists
    const business = await prisma.business.findUnique({
      where: { business_id }
    });

    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    // Create review
    const review = await prisma.businessReview.create({
      data: {
        user_id,
        business_id,
        rating,
        content
      },
      include: {
        user: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true
          }
        }
      }
    });

    res.status(201).json({
      message: "Review created successfully",
      review
    });
  } catch (error) {
    console.error("Error creating business review:", error);
    res.status(500).json({ error: error.message });
  }
});

// Create a travel plan review
router.post("/travel_plan", authenticateToken, validate(createReviewSchema), async (req, res) => {
  try {
    const { travel_plan_id, rating, content } = req.body;
    const user_id = req.user.id;

    if (!travel_plan_id) {
      return res.status(400).json({ error: "travel_plan_id is required" });
    }

    // Check if travel plan exists
    const travelPlan = await prisma.travelPlan.findUnique({
      where: { travel_plan_id }
    });

    if (!travelPlan) {
      return res.status(404).json({ error: "Travel plan not found" });
    }

    // Create review
    const review = await prisma.travelPlanReview.create({
      data: {
        user_id,
        travel_plan_id,
        rating,
        content
      },
      include: {
        user: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true
          }
        }
      }
    });

    res.status(201).json({
      message: "Review created successfully",
      review
    });
  } catch (error) {
    console.error("Error creating travel plan review:", error);
    res.status(500).json({ error: error.message });
  }
}); //di pa mareview cuz wala pa travel plan

// Get reviews for a specific travel plan
router.get("/travel_plan/:id", async (req, res) => {
  try {
    const travel_plan_id = parseInt(req.params.id);

    const reviews = await prisma.travelPlanReview.findMany({
      where: { travel_plan_id },
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
      data: reviews
    });
  } catch (error) {
    console.error("Error fetching travel plan reviews:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
