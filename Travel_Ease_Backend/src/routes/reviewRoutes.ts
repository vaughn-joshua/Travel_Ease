import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { validate } from '../schemas/validation.js';
import { createReviewSchema } from '../schemas/validation.js';
import { prisma, executeWithRetry, handlePrismaError } from '../lib/prismaHelpers.js';

const router = Router();

// Create a business review
router.post('/business', authenticateToken, validate(createReviewSchema), async (req: Request, res: Response) => {
  try {
    const { business_id, rating, content } = req.body;
    const user_id = req.user!.id;

    if (!business_id) {
      return res.status(400).json({ error: 'business_id is required' });
    }

    // Check if business exists
    const business = await executeWithRetry(() =>
      prisma.business.findUnique({
        where: { business_id }
      })
    );

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // Create review
    const review = await executeWithRetry(() =>
      prisma.businessReview.create({
        data: {
          user_id,
          business_id,
          rating,
          content
        }
      })
    );

    // Fetch with user info
    const reviewWithUser = await executeWithRetry(() =>
      prisma.businessReview.findUnique({
        where: { review_id: review.review_id },
        include: {
          user: {
            select: {
              user_id: true,
              first_name: true,
              last_name: true
            }
          }
        }
      })
    );

    res.status(201).json({
      message: 'Review created successfully',
      review: reviewWithUser
    });
  } catch (error) {
    console.error('Error creating business review:', error);
    return handlePrismaError(error, res, 'Creating business review');
  }
});

// Create a travel plan review
router.post('/travel_plan', authenticateToken, validate(createReviewSchema), async (req: Request, res: Response) => {
  try {
    const { travel_plan_id, rating, content } = req.body;
    const user_id = req.user!.id;

    if (!travel_plan_id) {
      return res.status(400).json({ error: 'travel_plan_id is required' });
    }

    // Check if travel plan exists
    const travelPlan = await executeWithRetry(() =>
      prisma.travelPlan.findUnique({
        where: { travel_plan_id }
      })
    );

    if (!travelPlan) {
      return res.status(404).json({ error: 'Travel plan not found' });
    }

    // Create review
    const review = await executeWithRetry(() =>
      prisma.travelPlanReview.create({
        data: {
          user_id,
          travel_plan_id,
          rating,
          content
        }
      })
    );

    // Fetch with user info
    const reviewWithUser = await executeWithRetry(() =>
      prisma.travelPlanReview.findUnique({
        where: { review_id: review.review_id },
        include: {
          user: {
            select: {
              user_id: true,
              first_name: true,
              last_name: true
            }
          }
        }
      })
    );

    res.status(201).json({
      message: 'Review created successfully',
      review: reviewWithUser
    });
  } catch (error) {
    console.error('Error creating travel plan review:', error);
    return handlePrismaError(error, res, 'Creating travel plan review');
  }
});

// Get reviews for a specific travel plan
router.get('/travel_plan/:id', async (req: Request, res: Response) => {
  try {
    const travel_plan_id = parseInt(req.params.id);

    const reviews = await executeWithRetry(() =>
      prisma.travelPlanReview.findMany({
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
        orderBy: { review_date: 'desc' }
      })
    );

    res.json({
      message: 'Success',
      data: reviews
    });
  } catch (error) {
    console.error('Error fetching travel plan reviews:', error);
    return handlePrismaError(error, res, 'Fetching travel plan reviews');
  }
});

export default router;

