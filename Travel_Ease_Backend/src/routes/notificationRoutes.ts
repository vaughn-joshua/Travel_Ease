import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  respondToInvitation,
} from '../modules/notification/index.js';

const router = Router();

// All notification routes require authentication
router.use(authenticateToken);

// Get all notifications for the current user
router.get('/', getNotifications);

// Get unread notification count
router.get('/unread-count', getUnreadCount);

// Mark a specific notification as read
router.patch('/:id/read', markAsRead);

// Mark all notifications as read
router.patch('/read-all', markAllAsRead);

// Delete a notification
router.delete('/:id', deleteNotification);

// Respond to a plan invitation (accept/decline)
router.post('/respond-invitation', respondToInvitation);

export default router;

