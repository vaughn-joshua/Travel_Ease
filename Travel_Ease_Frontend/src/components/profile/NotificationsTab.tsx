import { useState } from 'react';
import { useNotifications } from '../../features/notifications/queries';
import { useRespondToInvitation, useMarkNotificationAsRead, useMarkAllNotificationsAsRead } from '../../features/notifications/mutations';

import type { Notification } from '../../services/api';

export function NotificationsTab() {
  const { data: notifications = [], isLoading, refetch } = useNotifications(true);
  const respondToInvitation = useRespondToInvitation();
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const [respondingTo, setRespondingTo] = useState<number | null>(null);

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const invitations = notifications.filter(n => n.type === 'plan_invitation' && !n.is_read);

  const handleAccept = async (notification: Notification) => {
    setRespondingTo(notification.notification_id);
    try {
      await respondToInvitation.mutateAsync({ notificationId: notification.notification_id, accept: true });
      refetch();
    } finally {
      setRespondingTo(null);
    }
  };

  const handleDecline = async (notification: Notification) => {
    setRespondingTo(notification.notification_id);
    try {
      await respondToInvitation.mutateAsync({ notificationId: notification.notification_id, accept: false });
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

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-primary-red rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllAsRead} disabled={markAllAsRead.isPending} className="text-sm text-primary-red hover:text-primary-red-dark transition-colors disabled:opacity-50">
            Mark all as read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-red"></div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-6 text-gray-500">No notifications yet</div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {invitations.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Pending Invitations</h4>
              <div className="space-y-2">
                {invitations.map((notification) => (
                  <div key={notification.notification_id} className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-gray-900">{notification.title}</p>
                        <p className="text-sm text-gray-600">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatDate(notification.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => handleAccept(notification)} disabled={respondingTo === notification.notification_id} className="flex-1 py-2 px-3 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50">
                        {respondingTo === notification.notification_id ? '...' : 'Accept'}
                      </button>
                      <button onClick={() => handleDecline(notification)} disabled={respondingTo === notification.notification_id} className="flex-1 py-2 px-3 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50">
                        {respondingTo === notification.notification_id ? '...' : 'Decline'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {notifications.filter(n => n.type !== 'plan_invitation' || n.is_read).map((notification) => (
            <div key={notification.notification_id} onClick={() => handleMarkAsRead(notification)} className={`p-3 rounded-lg cursor-pointer transition-colors ${notification.is_read ? 'bg-gray-50 hover:bg-gray-100' : 'bg-blue-50 border border-blue-100 hover:bg-blue-100'}`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className={`font-medium ${notification.is_read ? 'text-gray-700' : 'text-gray-900'}`}>{notification.title}</p>
                  <p className="text-sm text-gray-600">{notification.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(notification.created_at)}</p>
                </div>
                {!notification.is_read && (
                  <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
