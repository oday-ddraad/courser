'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import PaymentProofForm from './PaymentProofForm';


interface PaymentProofSectionProps {
  paymentId: string;
  requireOperationNumber?: boolean;
}

export default function PaymentProofSection({
  paymentId,
  requireOperationNumber = true,
}: PaymentProofSectionProps) {
  const router = useRouter();
  const t = useTranslations('Payment');
  const tp = (key: string, fallback: string) => {
    try {
      return t(key as never);
    } catch {
      return fallback;
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');


  const handleSubmit = async (payload: {
    operationNumber?: string;
    receiptImages: string[];
  }) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/payments/${paymentId}/submit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operationNumber: payload.operationNumber?.trim() || '',
          receiptScreenshots: payload.receiptImages,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || tp('errors.submitFailed', 'Failed to submit payment proof'));
      }

      setSuccess(
        tp('submittedSuccess', 'Payment proof submitted successfully. Waiting for admin review.')
      );
      router.refresh();
    } catch (err: any) {
      setError(err?.message || tp('errors.submitFailed', 'Failed to submit payment proof'));
    } finally {

      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300">
          {success}
        </div>
      )}

      {isSubmitting && (
        <div className="text-sm text-gray-600 dark:text-gray-300">
          {tp('submittingProof', 'Submitting payment proof...')}
        </div>
      )}


      <PaymentProofForm
        requireOperationNumber={requireOperationNumber}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
