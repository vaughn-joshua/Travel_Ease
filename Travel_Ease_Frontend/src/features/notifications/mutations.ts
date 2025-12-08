/**
 * Notification Mutation Hooks
 * 
 * TanStack Query mutations for notification write operations.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationApi } from "../../services/api";
import { notificationKeys } from "./queries";

/**
 * useMarkNotificationAsRead
 * Marks a single notification as read.
 */
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: number) =>
      notificationApi.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

/**
 * useMarkAllNotificationsAsRead
 * Marks all notifications as read.
 */
export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

/**
 * useDeleteNotification
 * Deletes a notification.
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: number) =>
      notificationApi.deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

/**
 * useRespondToInvitation
 * Accepts or declines a plan invitation.
 */
export function useRespondToInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      notificationId,
      accept,
    }: {
      notificationId: number;
      accept: boolean;
    }) => notificationApi.respondToInvitation(notificationId, accept),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

