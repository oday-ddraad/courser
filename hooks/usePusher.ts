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

    // Initialize Pusher client
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: '/api/pusher/auth',
      auth: {
        headers: {
          // Pusher will use cookies automatically for session
        },
      },
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
    });

    pusher.connection.bind('error', (err: Error) => {
      setConnectionState('error');
      setError(err);
      console.error('Pusher connection error:', err);
    });

    pusherRef.current = pusher;

    return () => {
      pusher.disconnect();
      pusherRef.current = null;
    };
  }, [session?.user?.id]);

  const subscribe = useCallback((channelName: string) => {
    if (!pusherRef.current) return null;
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
