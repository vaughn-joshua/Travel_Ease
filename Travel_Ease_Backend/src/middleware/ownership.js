/**
 * Ownership and role-based access control middleware
 */

import { prisma, executeWithRetry } from "../lib/prismaHelpers.js";

/**
 * Verify user owns or has admin rights to a travel plan
 */
export const requirePlanOwnership = async (req, res, next) => {
  const planId = parseInt(req.params.id);
  const userId = req.user.id;

  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const [plan, participant] = await executeWithRetry(() =>
      Promise.all([
        prisma.travelPlan.findUnique({
          where: { travel_plan_id: planId }
        }),
        prisma.participant.findFirst({
          where: { travel_plan_id: planId, user_id: userId }
        })
      ])
    );

    if (!plan) {
      return res.status(404).json({ error: "Travel plan not found" });
    }

    // Check if user is owner or admin participant
    const isOwner = plan.user_id === userId;
    const isAdmin = participant?.role === 'Admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ 
        error: "Not authorized to modify this travel plan",
        details: "You must be the plan owner or an admin participant"
      });
    }

    // Attach plan to request for use in controller
    req.plan = plan;
    req.isOwner = isOwner;
    req.participant = participant;
    next();
  } catch (error) {
    console.error("Error checking plan ownership:", error);
    return res.status(500).json({ error: "Error verifying permissions" });
  }
};

/**
 * Verify user owns a business
 */
export const requireBusinessOwnership = async (req, res, next) => {
  const businessId = parseInt(req.params.id);
  const userId = req.user.id;

  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const business = await executeWithRetry(() =>
      prisma.business.findUnique({
        where: { business_id: businessId }
      })
    );

    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    if (business.user_id !== userId) {
      return res.status(403).json({ 
        error: "Not authorized to modify this business",
        details: "Only the business owner can make changes"
      });
    }

    // Attach business to request for use in controller
    req.business = business;
    next();
  } catch (error) {
    console.error("Error checking business ownership:", error);
    return res.status(500).json({ error: "Error verifying permissions" });
  }
};

/**
 * Verify user can edit an activity (plan owner/admin or activity creator)
 */
export const requireActivityAccess = async (req, res, next) => {
  const activityId = parseInt(req.params.id);
  const userId = req.user.id;

  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const activity = await executeWithRetry(() =>
      prisma.activity.findUnique({
        where: { activity_id: activityId },
        include: {
          travel_plan: true
        }
      })
    );

    if (!activity) {
      return res.status(404).json({ error: "Activity not found" });
    }

    const plan = activity.travel_plan;
    if (!plan) {
      return res.status(404).json({ error: "Associated travel plan not found" });
    }

    // Get participant info
    const participant = await executeWithRetry(() =>
      prisma.participant.findFirst({
        where: { travel_plan_id: plan.travel_plan_id, user_id: userId }
      })
    );

    // Check if user is plan owner, admin participant, or activity creator
    const isOwner = plan.user_id === userId;
    const isActivityCreator = activity.user_id === userId;
    const isAdmin = participant?.role === 'Admin';
    const isEditor = participant?.role === 'Editor';

    if (!isOwner && !isAdmin && !isEditor && !isActivityCreator) {
      return res.status(403).json({ 
        error: "Not authorized to modify this activity",
        details: "You must be the plan owner, admin/editor participant, or activity creator"
      });
    }

    req.activity = activity;
    req.plan = plan;
    next();
  } catch (error) {
    console.error("Error checking activity access:", error);
    return res.status(500).json({ error: "Error verifying permissions" });
  }
};
