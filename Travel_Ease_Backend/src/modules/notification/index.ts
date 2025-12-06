/**
 * Notification Module
 * 
 * Handles notification CRUD operations and invitation responses.
 */

import { Request, Response } from 'express';
import { prisma, executeWithRetry, handlePrismaError } from '../../lib/prismaHelpers.js';

/**
 * Get all notifications for the current user
 * GET /notification
 */
export async function getNotifications(req: Request, res: Response) {
  try {
    const userId = req.user!.id;

    const notifications = await executeWithRetry(() =>
      prisma.notification.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        take: 50, // Limit to last 50 notifications
      })
    );

    res.json({
      message: "Success",
      data: notifications
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return handlePrismaError(error, res, 'Fetching notifications');
  }
}

/**
 * Get unread notification count
 * GET /notification/unread-count
 */
export async function getUnreadCount(req: Request, res: Response) {
  try {
    const userId = req.user!.id;

    const count = await executeWithRetry(() =>
      prisma.notification.count({
        where: { user_id: userId, is_read: false }
      })
    );

    res.json({ count });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return handlePrismaError(error, res, 'Fetching unread count');
  }
}

/**
 * Mark a notification as read
 * PATCH /notification/:id/read
 */
export async function markAsRead(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const notification = await executeWithRetry(() =>
      prisma.notification.findFirst({
        where: { notification_id: parseInt(id), user_id: userId }
      })
    );

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    await executeWithRetry(() =>
      prisma.notification.update({
        where: { notification_id: parseInt(id) },
        data: { is_read: true }
      })
    );

    res.json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return handlePrismaError(error, res, 'Marking notification as read');
  }
}

/**
 * Mark all notifications as read
 * PATCH /notification/read-all
 */
export async function markAllAsRead(req: Request, res: Response) {
  try {
    const userId = req.user!.id;

    const result = await executeWithRetry(() =>
      prisma.notification.updateMany({
        where: { user_id: userId, is_read: false },
        data: { is_read: true }
      })
    );

    res.json({ 
      message: "All notifications marked as read",
      count: result.count
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return handlePrismaError(error, res, 'Marking all notifications as read');
  }
}

/**
 * Delete a notification
 * DELETE /notification/:id
 */
export async function deleteNotification(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const notification = await executeWithRetry(() =>
      prisma.notification.findFirst({
        where: { notification_id: parseInt(id), user_id: userId }
      })
    );

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    await executeWithRetry(() =>
      prisma.notification.delete({
        where: { notification_id: parseInt(id) }
      })
    );

    res.json({ message: "Notification deleted" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return handlePrismaError(error, res, 'Deleting notification');
  }
}

/**
 * Respond to a plan invitation
 * POST /notification/respond-invitation
 * Body: { notification_id, accept: boolean }
 */
export async function respondToInvitation(req: Request, res: Response) {
  try {
    const { notification_id, accept } = req.body;
    const userId = req.user!.id;

    if (notification_id === undefined || accept === undefined) {
      return res.status(400).json({ error: "notification_id and accept are required" });
    }

    // Get the notification
    const notification = await executeWithRetry(() =>
      prisma.notification.findFirst({
        where: { 
          notification_id: parseInt(notification_id), 
          user_id: userId,
          type: 'plan_invitation'
        }
      })
    );

    if (!notification) {
      return res.status(404).json({ error: "Invitation not found" });
    }

    const data = notification.data as { travel_plan_id?: number; inviter_id?: number } | null;
    const planId = data?.travel_plan_id;

    if (!planId) {
      return res.status(400).json({ error: "Invalid invitation data" });
    }

    // Check if participant record exists
    const participant = await executeWithRetry(() =>
      prisma.participant.findFirst({
        where: { travel_plan_id: planId, user_id: userId }
      })
    );

    if (!participant) {
      // If user declined and record doesn't exist, just mark notification as read
      if (!accept) {
        await executeWithRetry(() =>
          prisma.notification.update({
            where: { notification_id: parseInt(notification_id) },
            data: { is_read: true }
          })
        );
        return res.json({ message: "Invitation declined" });
      }
      return res.status(404).json({ error: "Participant record not found" });
    }

    if (accept) {
      // Accept: Update participant status to approved
      await executeWithRetry(() =>
        prisma.participant.update({
          where: { participant_id: participant.participant_id },
          data: { status: true }
        })
      );

      // Mark notification as read
      await executeWithRetry(() =>
        prisma.notification.update({
          where: { notification_id: parseInt(notification_id) },
          data: { is_read: true }
        })
      );

      res.json({ message: "Invitation accepted. You are now a participant." });
    } else {
      // Decline: Remove participant record
      await executeWithRetry(() =>
        prisma.participant.delete({
          where: { participant_id: participant.participant_id }
        })
      );

      // Mark notification as read
      await executeWithRetry(() =>
        prisma.notification.update({
          where: { notification_id: parseInt(notification_id) },
          data: { is_read: true }
        })
      );

      res.json({ message: "Invitation declined" });
    }
  } catch (error) {
    console.error("Error responding to invitation:", error);
    return handlePrismaError(error, res, 'Responding to invitation');
  }
}

/**
 * Create a notification (internal helper, not an endpoint)
 */
export async function createNotification(
  userId: number,
  type: string,
  title: string,
  message: string,
  data?: Record<string, unknown>
) {
  return executeWithRetry(() =>
    prisma.notification.create({
      data: {
        user_id: userId,
        type,
        title,
        message,
        data: data || null
      }
    })
  );
}

