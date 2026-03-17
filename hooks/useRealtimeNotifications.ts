'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePusher } from './usePusher';

type NotificationEvent = {
  notificationId: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
  data?: Record<string, any>;
  timestamp: string;
};

interface UseRealtimeNotificationsOptions {
  onNotificationEvent?: () => void;
}

export function useRealtimeNotifications(options: UseRealtimeNotificationsOptions = {}) {
  const { onNotificationEvent } = options;
  const { data: session } = useSession();
  const { subscribe, unsubscribe, connectionState } = usePusher();

  useEffect(() => {
    console.log('[DEBUG] useRealtimeNotifications - useEffect triggered', {
      hasSession: !!session?.user?.id,
      connectionState
    });

    if (!session?.user?.id || connectionState !== 'connected') {
      console.log('[DEBUG] useRealtimeNotifications - conditions not met, returning early');
      return;
    }

    const userId = session.user.id;
    const channelName = `private-user-${userId}`;
    console.log('[DEBUG] useRealtimeNotifications - subscribing to channel:', channelName);

    const channel = subscribe(channelName);

    if (!channel) {
      console.log('[DEBUG] useRealtimeNotifications - channel subscription failed');
      return;
    }

    // Handle new notification events
    const handleNewNotification = (data: NotificationEvent) => {
      console.log('[DEBUG] useRealtimeNotifications - Pusher event: new-notification', data);

      // Notify consumers to refresh UI state
      console.log('[DEBUG] useRealtimeNotifications - calling onNotificationEvent');
      onNotificationEvent?.();

      // Optional: Show browser notification if permitted
      if (Notification.permission === 'granted') {
        console.log('[DEBUG] useRealtimeNotifications - showing browser notification');
        new Notification(data.title, {
          body: data.message,
          icon: '/icon.png',
        });
      }
    };

    // Handle notification read events
    const handleNotificationRead = () => {
      console.log('[DEBUG] useRealtimeNotifications - Pusher event: notification-read');
      onNotificationEvent?.();
    };

    // Handle all notifications read event
    const handleAllRead = () => {
      console.log('[DEBUG] useRealtimeNotifications - Pusher event: all-notifications-read');
      onNotificationEvent?.();
    };

    // Bind to Pusher events
    console.log('[DEBUG] useRealtimeNotifications - binding event handlers');
    channel.bind('new-notification', handleNewNotification);
    channel.bind('notification-read', handleNotificationRead);
    channel.bind('all-notifications-read', handleAllRead);

    console.log('[DEBUG] useRealtimeNotifications - event handlers bound successfully');

    return () => {
      console.log('[DEBUG] useRealtimeNotifications - cleanup: unbinding event handlers');
      channel.unbind('new-notification', handleNewNotification);
      channel.unbind('notification-read', handleNotificationRead);
      channel.unbind('all-notifications-read', handleAllRead);
      unsubscribe(channelName);
      console.log('[DEBUG] useRealtimeNotifications - cleanup completed');
    };
  }, [session?.user?.id, connectionState, subscribe, unsubscribe, onNotificationEvent]);

  console.log('[DEBUG] useRealtimeNotifications - hook initialized with connectionState:', connectionState);
}

export default useRealtimeNotifications;
