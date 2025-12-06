/**
 * Notification Query Hooks
 * 
 * TanStack Query hooks for notification read operations.
 */

import { useQuery } from "@tanstack/react-query";
import { notificationApi, type Notification } from "../../services/api";

export const notificationKeys = {
  all: ["notifications"] as const,
  list: () => [...notificationKeys.all, "list"] as const,
  unreadCount: () => [...notificationKeys.all, "unread-count"] as const,
};

/**
 * useNotifications
 * Fetches all notifications for the current user.
 */
export function useNotifications(enabled = true) {
  return useQuery<Notification[], Error>({
    queryKey: notificationKeys.list(),
    queryFn: async () => {
      const result = await notificationApi.getNotifications();
      return result.data;
    },
    enabled,
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * useUnreadNotificationCount
 * Fetches the count of unread notifications.
 */
export function useUnreadNotificationCount(enabled = true) {
  return useQuery<number, Error>({
    queryKey: notificationKeys.unreadCount(),
    queryFn: async () => {
      const result = await notificationApi.getUnreadCount();
      return result.count;
    },
    enabled,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Refetch every minute
  });
}

