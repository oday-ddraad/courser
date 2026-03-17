'use client';

import { useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import type { Channel } from 'pusher-js';
import { usePusher } from './usePusher';
import { useNotifications } from './useNotifications';

type NotificationEvent = {
  notificationId: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
  data?: Record<string, any>;
  timestamp: string;
};

export function useRealtimeNotifications() {
  const { data: session } = useSession();
  const { subscribe, unsubscribe, connectionState } = usePusher();
  const { refetch } = useNotifications();

  useEffect(() => {
    if (!session?.user?.id || connectionState !== 'connected') {
      return;
    }

    const userId = session.user.id;
    const channelName = `private-user-${userId}`;
    const channel = subscribe(channelName);

    if (!channel) return;

    // Handle new notification events
    const handleNewNotification = (data: NotificationEvent) => {
      console.log('New notification received:', data);
      
      // Refetch notifications to update UI
      refetch();
      
      // Optional: Show browser notification if permitted
      if (Notification.permission === 'granted') {
        new Notification(data.title, {
          body: data.message,
          icon: '/icon.png',
        });
      }
    };

    // Handle notification read events
    const handleNotificationRead = () => {
      refetch();
    };

    // Handle all notifications read event
    const handleAllRead = () => {
      refetch();
    };

    // Bind to Pusher events
    channel.bind('new-notification', handleNewNotification);
    channel.bind('notification-read', handleNotificationRead);
    channel.bind('all-notifications-read', handleAllRead);

    return () => {
      channel.unbind('new-notification', handleNewNotification);
      channel.unbind('notification-read', handleNotificationRead);
      channel.unbind('all-notifications-read', handleAllRead);
      unsubscribe(channelName);
    };
  }, [session?.user?.id, connectionState, subscribe, unsubscribe, refetch]);
}

export default useRealtimeNotifications;
