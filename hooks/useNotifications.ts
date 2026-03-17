'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { usePusher } from './usePusher';

type NotificationType =
  |'custom'
  | 'payment_approved'
  | 'payment_rejected'
  | 'course_enrolled'
  | 'live_stream_starting'
  | 'lesson_available'
  | 'course_completed'
  | 'admin_message'
  | 'instructor_message'
  | 'course_approved'
  | 'course_rejected'
  | 'course_submitted'
  | 'live_lesson_reminder'
  | 'live_lesson_instructor_reminder'
  | 'live_lesson_final_reminder'
  | 'live_lesson_started'
  | 'live_lesson_ended';

interface Notification {
  _id: string;
  type: NotificationType;
  title: {
    en: string;
    de: string;
    ar: string;
  };
  message: {
    en: string;
    de: string;
    ar: string;
  };
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
  pusherStatus: {
    isConnected: boolean;
    isPusherOnly: boolean;
    connectionError: string | null;
  };
}

export function useNotifications(): UseNotificationsReturn {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pusherStatus, setPusherStatus] = useState({
    isConnected: false,
    isPusherOnly: true, // Pusher is now the only notification method
    connectionError: null as string | null,
  });

  // Use Pusher hook for real-time notifications
  const { pusher, connectionState, error: pusherError } = usePusher();

  // Update Pusher status based on connection state and errors
  useEffect(() => {
    const isConnected = connectionState === 'connected';
    const connectionError = pusherError?.message || null;

    setPusherStatus(prev => ({
      ...prev,
      isConnected,
      connectionError,
    }));

    // When Pusher connects successfully, fetch notifications
    if (isConnected && !connectionError) {
      fetchNotifications();
    }
  }, [connectionState, pusherError]);

  const fetchNotifications = useCallback(async () => {
    if (!session?.user) {
      console.log('[DEBUG] No session user, skipping fetch');
      setIsLoading(false);
      return;
    }

    try {
      console.log('[DEBUG] Fetching notifications for user:', session.user.id);
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/notifications');

      console.log('[DEBUG] API response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          // Not authenticated, silently fail
          console.log('[DEBUG] Unauthorized, clearing notifications');
          setNotifications([]);
          return;
        }
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      console.log('[DEBUG] API response data:', data);

      if (data.success) {
        // API returns { data: { notifications: [...], unreadCount: 0 } }
        const notificationsData = data.data?.notifications || [];
        console.log('[DEBUG] Received', notificationsData.length, 'notifications');
        setNotifications(notificationsData);
      } else {
        throw new Error(data.error || 'Failed to fetch notifications');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [session]);


  // Fetch notifications on mount and when session changes
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Set up Pusher real-time event listeners
  useEffect(() => {
    if (!session?.user || !pusher || !pusherStatus.isConnected) return;

    const channel = pusher.subscribe(`private-user-${session.user.id}`);

    const handleNewNotification = (data: any) => {
      console.log('New notification received via Pusher:', data);
      fetchNotifications(); // Refresh notifications
    };

    const handleAllRead = () => {
      console.log('All notifications marked as read via Pusher');
      fetchNotifications(); // Refresh notifications
    };

    // Bind to Pusher events
    channel.bind('new-notification', handleNewNotification);
    channel.bind('all-notifications-read', handleAllRead);

    return () => {
      channel.unbind('new-notification', handleNewNotification);
      channel.unbind('all-notifications-read', handleAllRead);
      pusher.unsubscribe(`private-user-${session.user.id}`);
    };
  }, [session, pusher, pusherStatus.isConnected, fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      console.log('[DEBUG] Marking notification as read:', id);
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
      });

      console.log('[DEBUG] Mark as read API response:', response.status);

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      // Update local state
      console.log('[DEBUG] Updating local state for notification:', id);
      setNotifications((prev) =>
        prev.map((notification) =>
          notification._id === id
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
      throw err;
    }
  }, []);


  const markAllAsRead = useCallback(async () => {
    try {
      console.log('[DEBUG] Marking all notifications as read');
      const response = await fetch('/api/notifications', {
        method: 'PUT',
      });

      console.log('[DEBUG] Mark all as read API response:', response.status);

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }

      // Update local state
      console.log('[DEBUG] Updating local state - all notifications marked as read');
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, isRead: true }))
      );
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      throw err;
    }
  }, []);


  const deleteNotification = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }

      // Update local state
      setNotifications((prev) =>
        prev.filter((notification) => notification._id !== id)
      );
    } catch (err) {
      console.error('Error deleting notification:', err);
      throw err;
    }
  }, []);

  // Ensure notifications is always an array before filtering
  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const unreadCount = safeNotifications.filter((n) => !n.isRead).length;

  console.log('[DEBUG] useNotifications hook state:', {
    notificationsCount: safeNotifications.length,
    unreadCount,
    isLoading,
    error,
    pusherStatus
  });

  return {
    notifications: safeNotifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: fetchNotifications,
    pusherStatus,
  };

}
