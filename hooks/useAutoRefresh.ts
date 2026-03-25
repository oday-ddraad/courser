'use client';

import { useCallback, useEffect, useRef } from 'react';

type MaybePromise = void | Promise<void>;

export function useAutoRefresh(fetchFn: () => MaybePromise, intervalMs = 10000) {
  const inFlightRef = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      await fetchFn();
    } finally {
      inFlightRef.current = false;
    }
  }, [fetchFn]);

  useEffect(() => {
    let mounted = true;

    const timerId = setInterval(() => {
      if (!mounted) return;
      void refresh();
    }, intervalMs);

    return () => {
      mounted = false;
      clearInterval(timerId);
    };
  }, [refresh, intervalMs]);
}
