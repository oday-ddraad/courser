'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PaymentMethodForm, { PaymentMethodFormValues } from '@/components/payments/PaymentMethodForm';

interface RawMethod {
  _id: string;
  name: any;
  description?: any;
  instructions?: any;
  paymentAddress?: string;
  isGlobal?: boolean;
  countries?: string[];
  requiresOperationNumber?: boolean;
  requiresScreenshot?: boolean;
  isActive?: boolean;
}

export default function EditPaymentMethodPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [method, setMethod] = useState<RawMethod | null>(null);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/payment-methods/${id}`, { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok || !json?.success) {
          throw new Error(json?.error || 'Failed to load payment method');
        }
        setMethod(json.data);
      } catch (e: any) {
        setError(e.message || 'Failed to load payment method');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const initialValues = useMemo<Partial<PaymentMethodFormValues>>(() => {
    if (!method) return {};
    return {
      name: method.name?.en || '',
      description: method.description?.en || '',
      instructions: method.instructions?.en || '',
      paymentAddress: method.paymentAddress || '',
      isGlobal: Boolean(method.isGlobal),
      countries: method.countries || [],
      requiresOperationNumber: method.requiresOperationNumber ?? true,
      requiresScreenshot: method.requiresScreenshot ?? true,
      isActive: method.isActive ?? true,
    };
  }, [method]);

  const handleUpdate = async (values: PaymentMethodFormValues) => {
    if (!id) return;
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
      const res = await fetch(`/api/payment-methods/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || 'Failed to update payment method');
      }

      router.push('/en/dashboard/admin/payments/methods');
    } catch (e: any) {
      setError(e.message || 'Failed to update payment method');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-5 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
        Loading payment method...
      </div>
    );
  }

  if (!method) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
        {error || 'Payment method not found.'}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Edit Payment Method</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Update payment method details and activation settings.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      ) : null}

      <PaymentMethodForm initialValues={initialValues} onSubmit={handleUpdate} />

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
