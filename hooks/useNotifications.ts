'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

type NotificationType = 
  | 'payment_approved' 
  | 'payment_rejected' 
  | 'course_enrolled' 
  | 'live_stream_starting' 
  | 'lesson_available' 
  | 'course_completed' 
  | 'admin_message' 
  | 'instructor_message';

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
}

export function useNotifications(): UseNotificationsReturn {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!session?.user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/notifications');
      
      if (!response.ok) {
        if (response.status === 401) {
          // Not authenticated, silently fail
          setNotifications([]);
          return;
        }
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      
      if (data.success) {
        // API returns { data: { notifications: [...], unreadCount: 0 } }
        const notificationsData = data.data?.notifications || [];
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

  const markAsRead = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      // Update local state
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
      const response = await fetch('/api/notifications/read-all', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }

      // Update local state
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

  return {
    notifications: safeNotifications,
    unreadCount,

    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: fetchNotifications,
  };
}
