import { useState } from "react";
import { useNotifications } from "../../features/notifications/queries";
import {
  useRespondToInvitation,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
} from "../../features/notifications/mutations";

import type { Notification } from "../../services/api";

export function NotificationsTab() {
  const {
    data: notifications = [],
    isLoading,
    refetch,
  } = useNotifications(true);
  const respondToInvitation = useRespondToInvitation();
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const [respondingTo, setRespondingTo] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const itemsPerPage = 7; // Responsive: will adjust with CSS if needed
  const totalPages = Math.ceil(notifications.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedNotifications = notifications.slice(
    startIdx,
    startIdx + itemsPerPage,
  );

  const handleAccept = async (notification: Notification) => {
    setRespondingTo(notification.notification_id);
    try {
      await respondToInvitation.mutateAsync({
        notificationId: notification.notification_id,
        accept: true,
      });
      refetch();
    } finally {
      setRespondingTo(null);
    }
  };

  const handleDecline = async (notification: Notification) => {
    setRespondingTo(notification.notification_id);
    try {
      await respondToInvitation.mutateAsync({
        notificationId: notification.notification_id,
        accept: false,
      });
      refetch();
    } finally {
      setRespondingTo(null);
    }
  };

  const handleMarkAsRead = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead.mutateAsync(notification.notification_id);
      refetch();
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead.mutateAsync();
    refetch();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="p-6">
      {/* Notifications Card */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Notifications
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Manage your notifications and pending invitations.
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={markAllAsRead.isPending}
              className="shrink-0 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Mark all as read
            </button>
          )}
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-red"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No notifications yet
            </div>
          ) : (
            <>
              {/* Notifications Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Title
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Message
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Date
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {paginatedNotifications.map((notification, idx) => (
                        <tr
                          key={notification.notification_id}
                          className={`${idx > 0 ? "border-t-2 border-t-gray-100" : "border-b border-gray-200"}`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {notification.type === "plan_invitation" && (
                              <span className="inline-flex items-center rounded-full bg-amber-200/70 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-800">
                                Invitation
                              </span>
                            )}
                            {!notification.is_read && (
                              <span className="ml-2 h-2 w-2 rounded-full bg-blue-500 inline-block"></span>
                            )}
                            {notification.title}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                            {notification.message}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(notification.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {notification.type === "plan_invitation" ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleAccept(notification)}
                                  disabled={
                                    respondingTo ===
                                    notification.notification_id
                                  }
                                  className="px-3 py-1 bg-green-500 text-white rounded-md text-xs hover:bg-green-600 disabled:opacity-50"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleDecline(notification)}
                                  disabled={
                                    respondingTo ===
                                    notification.notification_id
                                  }
                                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-xs hover:bg-gray-300 disabled:opacity-50"
                                >
                                  Decline
                                </button>
                              </div>
                            ) : (
                              !notification.is_read && (
                                <button
                                  onClick={() => handleMarkAsRead(notification)}
                                  className="px-3 py-1 border border-blue-200 bg-white text-blue-700 rounded-md text-xs hover:bg-blue-100"
                                >
                                  Mark read
                                </button>
                              )
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="border-t border-gray-200 bg-gray-50 px-6 py-3 flex items-center justify-between">
                    <span className="text-sm text-gray-700">
                      Showing page{" "}
                      <span className="font-medium">{currentPage}</span> of{" "}
                      <span className="font-medium">{totalPages}</span> (
                      {notifications.length} total)
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setCurrentPage(Math.max(1, currentPage - 1))
                        }
                        disabled={currentPage === 1}
                        className="p-2 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        ←
                      </button>
                      <button
                        onClick={() =>
                          setCurrentPage(Math.min(totalPages, currentPage + 1))
                        }
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
