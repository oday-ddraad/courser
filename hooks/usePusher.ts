'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Pusher from 'pusher-js';
import { useSession } from 'next-auth/react';

type PusherConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UsePusherReturn {
  pusher: Pusher | null;
  connectionState: PusherConnectionState;
  error: Error | null;
  subscribe: (channelName: string) => ReturnType<Pusher['subscribe']> | null;
  unsubscribe: (channelName: string) => void;
}

export function usePusher(): UsePusherReturn {
  const { data: session } = useSession();
  const pusherRef = useRef<Pusher | null>(null);
  const [connectionState, setConnectionState] = useState<PusherConnectionState>('disconnected');
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!session?.user?.id) {
      return;
    }

    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    if (!pusherKey || !pusherCluster) {
      const configError = new Error('Missing Pusher client configuration. Please set NEXT_PUBLIC_PUSHER_KEY and NEXT_PUBLIC_PUSHER_CLUSTER in your .env.local file.');
      setConnectionState('error');
      setError(configError);
      console.error('Pusher config error:', configError.message);
      console.warn('Pusher real-time notifications will be disabled. Please configure Pusher credentials to enable real-time features.');
      return;
    }


    // Ensure stale instance is cleaned before creating a new one
    if (pusherRef.current) {
      pusherRef.current.disconnect();
      pusherRef.current = null;
    }

    // Initialize Pusher client
    const pusher = new Pusher(pusherKey, {
      cluster: pusherCluster,
      authEndpoint: '/api/pusher/auth',
      auth: {
        headers: {
          // Pusher will use cookies automatically for session
        },
      },
      enabledTransports: ['ws', 'wss', 'xhr_streaming', 'xhr_polling'],
      disableStats: true,
    });

    // Connection event handlers
    pusher.connection.bind('connecting', () => {
      setConnectionState('connecting');
      setError(null);
    });

    pusher.connection.bind('connected', () => {
      setConnectionState('connected');
      setError(null);
      console.log('Pusher connected');
    });

    pusher.connection.bind('disconnected', () => {
      setConnectionState('disconnected');
      console.warn('Pusher disconnected');
    });

    pusher.connection.bind('unavailable', () => {
      setConnectionState('error');
      console.error('Pusher connection unavailable');
    });

    pusher.connection.bind('failed', () => {
      setConnectionState('error');
      console.error('Pusher connection failed');
    });

    pusher.connection.bind('error', (err: unknown) => {
      setConnectionState('error');
      setError(err instanceof Error ? err : new Error('Unknown Pusher connection error'));

      if (err instanceof Error) {
        console.error('Pusher connection error:', err.message);

        // Provide helpful guidance for common Pusher errors
        if (err.message.includes('connection was interrupted') || err.message.includes('establish a connection')) {
          console.warn('Pusher connection failed. This could be due to:');
          console.warn('1. Missing or incorrect Pusher credentials in .env.local');
          console.warn('2. Network connectivity issues');
          console.warn('3. Pusher service outage');
          console.warn('4. Browser extensions blocking WebSocket connections');
        }

        if (err.message.includes('401') || err.message.includes('unauthorized')) {
          console.warn('Pusher authentication failed. Please check:');
          console.warn('1. NEXT_PUBLIC_PUSHER_KEY is correct');
          console.warn('2. NEXT_PUBLIC_PUSHER_CLUSTER is correct (e.g., "eu")');
          console.warn('3. PUSHER_SECRET is set in .env.local');
        }
      } else {
        console.error('Pusher connection error:', err);
      }
    });


    pusherRef.current = pusher;

    return () => {
      pusher.connection.unbind_all();
      pusher.disconnect();
      pusherRef.current = null;
    };
  }, [session?.user?.id]);


  const subscribe = useCallback((channelName: string) => {
    if (!pusherRef.current) return null;

    const existingChannel = pusherRef.current.channel(channelName);
    if (existingChannel) {
      return existingChannel;
    }

    return pusherRef.current.subscribe(channelName);
  }, []);


  const unsubscribe = useCallback((channelName: string) => {
    if (!pusherRef.current) return;
    pusherRef.current.unsubscribe(channelName);
  }, []);

  return {
    pusher: pusherRef.current,
    connectionState,
    error,
    subscribe,
    unsubscribe,
  };
}

export default usePusher;
