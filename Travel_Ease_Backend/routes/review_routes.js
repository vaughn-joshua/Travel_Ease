import { Router } from "express";
import { authenticateToken } from "../src/middleware/auth.js";
import { validate } from "../src/schemas/validation.js";
import { createReviewSchema } from "../src/schemas/validation.js";
import { Business, TravelPlan, BusinessReview, TravelPlanReview, User } from "../src/models/index.js";
import { executeWithRetry } from "../src/lib/sequelize.js";
import { handleSequelizeError } from "../src/lib/queryHelpers.js";

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
    const business = await executeWithRetry(() =>
      Business.findByPk(business_id)
    );

    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    // Create review
    const review = await executeWithRetry(() =>
      BusinessReview.create({
        user_id,
        business_id,
        rating,
        content
      })
    );

    // Fetch with user info
    const reviewWithUser = await executeWithRetry(() =>
      BusinessReview.findByPk(review.review_id, {
        include: [{
          model: User,
          as: 'user',
          attributes: ['user_id', 'first_name', 'last_name']
        }]
      })
    );

    res.status(201).json({
      message: "Review created successfully",
      review: reviewWithUser
    });
  } catch (error) {
    console.error("Error creating business review:", error);
    return handleSequelizeError(error, res, 'Creating business review');
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
    const travelPlan = await executeWithRetry(() =>
      TravelPlan.findByPk(travel_plan_id)
    );

    if (!travelPlan) {
      return res.status(404).json({ error: "Travel plan not found" });
    }

    // Create review
    const review = await executeWithRetry(() =>
      TravelPlanReview.create({
        user_id,
        travel_plan_id,
        rating,
        content
      })
    );

    // Fetch with user info
    const reviewWithUser = await executeWithRetry(() =>
      TravelPlanReview.findByPk(review.review_id, {
        include: [{
          model: User,
          as: 'user',
          attributes: ['user_id', 'first_name', 'last_name']
        }]
      })
    );

    res.status(201).json({
      message: "Review created successfully",
      review: reviewWithUser
    });
  } catch (error) {
    console.error("Error creating travel plan review:", error);
    return handleSequelizeError(error, res, 'Creating travel plan review');
  }
});

// Get reviews for a specific travel plan
router.get("/travel_plan/:id", async (req, res) => {
  try {
    const travel_plan_id = parseInt(req.params.id);

    const reviews = await executeWithRetry(() =>
      TravelPlanReview.findAll({
        where: { travel_plan_id },
        include: [{
          model: User,
          as: 'user',
          attributes: ['user_id', 'first_name', 'last_name']
        }],
        order: [['review_date', 'DESC']]
      })
    );

    res.json({
      message: "Success",
      data: reviews
    });
  } catch (error) {
    console.error("Error fetching travel plan reviews:", error);
    return handleSequelizeError(error, res, 'Fetching travel plan reviews');
  }
});

export default router;
