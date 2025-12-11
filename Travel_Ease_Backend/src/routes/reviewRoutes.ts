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
      prisma.business_review.create({
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
      prisma.business_review.findUnique({
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
      prisma.travel_plan.findUnique({
        where: { travel_plan_id }
      })
    );

    if (!travelPlan) {
      return res.status(404).json({ error: 'Travel plan not found' });
    }

    // Create review
    const review = await executeWithRetry(() =>
      prisma.travel_plan_review.create({
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
      prisma.travel_plan_review.findUnique({
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
      prisma.travel_plan_review.findMany({
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

// Update a business review
router.put('/business/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const review_id = parseInt(req.params.id);
    const user_id = req.user!.id;
    const { rating, content } = req.body;

    // Check if review exists and belongs to user
    const existingReview = await executeWithRetry(() =>
      prisma.business_review.findUnique({
        where: { review_id }
      })
    );

    if (!existingReview) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (existingReview.user_id !== user_id) {
      return res.status(403).json({ error: 'You can only edit your own reviews' });
    }

    // Update review
    const updatedReview = await executeWithRetry(() =>
      prisma.business_review.update({
        where: { review_id },
        data: {
          ...(rating !== undefined && { rating }),
          ...(content !== undefined && { content })
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
      })
    );

    res.json({
      message: 'Review updated successfully',
      review: updatedReview
    });
  } catch (error) {
    console.error('Error updating business review:', error);
    return handlePrismaError(error, res, 'Updating business review');
  }
});

// Delete a business review
router.delete('/business/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const review_id = parseInt(req.params.id);
    const user_id = req.user!.id;

    // Check if review exists and belongs to user
    const existingReview = await executeWithRetry(() =>
      prisma.business_review.findUnique({
        where: { review_id }
      })
    );

    if (!existingReview) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (existingReview.user_id !== user_id) {
      return res.status(403).json({ error: 'You can only delete your own reviews' });
    }

    // Delete review
    await executeWithRetry(() =>
      prisma.business_review.delete({
        where: { review_id }
      })
    );

    res.json({
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting business review:', error);
    return handlePrismaError(error, res, 'Deleting business review');
  }
});

// Update a travel plan review
router.put('/travel_plan/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const review_id = parseInt(req.params.id);
    const user_id = req.user!.id;
    const { rating, content } = req.body;

    // Check if review exists and belongs to user
    const existingReview = await executeWithRetry(() =>
      prisma.travel_plan_review.findUnique({
        where: { review_id }
      })
    );

    if (!existingReview) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (existingReview.user_id !== user_id) {
      return res.status(403).json({ error: 'You can only edit your own reviews' });
    }

    // Update review
    const updatedReview = await executeWithRetry(() =>
      prisma.travel_plan_review.update({
        where: { review_id },
        data: {
          ...(rating !== undefined && { rating }),
          ...(content !== undefined && { content })
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
      })
    );

    res.json({
      message: 'Review updated successfully',
      review: updatedReview
    });
  } catch (error) {
    console.error('Error updating travel plan review:', error);
    return handlePrismaError(error, res, 'Updating travel plan review');
  }
});

// Delete a travel plan review
router.delete('/travel_plan/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const review_id = parseInt(req.params.id);
    const user_id = req.user!.id;

    // Check if review exists and belongs to user
    const existingReview = await executeWithRetry(() =>
      prisma.travel_plan_review.findUnique({
        where: { review_id }
      })
    );

    if (!existingReview) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (existingReview.user_id !== user_id) {
      return res.status(403).json({ error: 'You can only delete your own reviews' });
    }

    // Delete review
    await executeWithRetry(() =>
      prisma.travel_plan_review.delete({
        where: { review_id }
      })
    );

    res.json({
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting travel plan review:', error);
    return handlePrismaError(error, res, 'Deleting travel plan review');
  }
});

export default router;

