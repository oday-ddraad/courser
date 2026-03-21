'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PaymentMethodForm, { PaymentMethodFormValues } from '@/components/payments/PaymentMethodForm';

export default function NewPaymentMethodPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (values: PaymentMethodFormValues) => {
    setSaving(true);
    setError('');

    const payload = {
      name: { en: values.name, de: values.name, ar: values.name },
      description: { en: values.description || '', de: values.description || '', ar: values.description || '' },
      instructions: { en: values.instructions || '', de: values.instructions || '', ar: values.instructions || '' },
      paymentAddress: values.paymentAddress,
      isGlobal: values.isGlobal,
      countries: values.countries,
      requiresOperationNumber: values.requiresOperationNumber,
      requiresScreenshot: values.requiresScreenshot,
      isActive: values.isActive,
    };

    try {
      const res = await fetch('/api/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || 'Failed to create payment method');
      }

      router.push('/en/dashboard/admin/payments/methods');
    } catch (e: any) {
      setError(e.message || 'Failed to create payment method');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Create Payment Method</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Add a new method and configure its details for students.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      ) : null}

      <PaymentMethodForm onSubmit={handleCreate} />

      <div className="flex items-center gap-3">
        <button
          disabled={saving}
          onClick={() => router.push('/en/dashboard/admin/payments/methods')}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700"
        >
          Back
        </button>
      </div>
    </div>
  );
}
