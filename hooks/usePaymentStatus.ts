'use client';

import { useCallback, useEffect, useState } from 'react';

interface PaymentStatusResponse {
  success: boolean;
  data?: {
    status: string;
    reviewedAt?: string;
    rejectionReason?: string;
    referenceCode?: string;
  };
  error?: string;
}

interface UsePaymentStatusOptions {
  paymentId?: string;
  intervalMs?: number;
  enabled?: boolean;
}

export function usePaymentStatus({
  paymentId,
  intervalMs = 10000,
  enabled = true,
}: UsePaymentStatusOptions) {
  const [status, setStatus] = useState<string | null>(null);
  const [reviewedAt, setReviewedAt] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [referenceCode, setReferenceCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(paymentId && enabled));
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!paymentId || !enabled) return;

    try {
      const res = await fetch(`/api/payments/${paymentId}`, {
        method: 'GET',
        cache: 'no-store',
      });

      const json: PaymentStatusResponse = await res.json();

      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error || 'Failed to fetch payment status');
      }

      setStatus(json.data.status);
      setReviewedAt(json.data.reviewedAt || null);
      setRejectionReason(json.data.rejectionReason || null);
      setReferenceCode(json.data.referenceCode || null);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch payment status');
    } finally {
      setLoading(false);
    }
  }, [paymentId, enabled]);

  useEffect(() => {
    if (!paymentId || !enabled) return;

    let active = true;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const run = async () => {
      if (!active) return;
      await fetchStatus();
    };

    run();
    intervalId = setInterval(run, intervalMs);

    return () => {
      active = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [paymentId, enabled, intervalMs, fetchStatus]);

  return {
    status,
    reviewedAt,
    rejectionReason,
    referenceCode,
    loading,
    error,
    refresh: fetchStatus,
  };
}
