'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import PaymentMethodList, { PaymentMethodListItem } from '@/components/payments/PaymentMethodList';
import PaymentMethodPreviewModal from '@/components/payments/PaymentMethodPreviewModal';

interface RawPaymentMethod {
  _id: string;
  name: { en?: string; de?: string; ar?: string } | string;
  description?: { en?: string; de?: string; ar?: string } | string;
  paymentAddress?: string;
  instructions?: { en?: string; de?: string; ar?: string } | string;
  qrCode?: string;
  logo?: string;
  isActive?: boolean;
}

export default function AdminPaymentMethodsPage() {
  const locale = useLocale() as 'en' | 'de' | 'ar';
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [rawMethods, setRawMethods] = useState<RawPaymentMethod[]>([]);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const fetchMethods = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/payment-methods', { cache: 'no-store' });
      const json = await res.json();
      if (res.ok && json?.success) {
        setRawMethods(json.data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  const methods: PaymentMethodListItem[] = useMemo(
    () =>
      rawMethods.map((m) => ({
        id: m._id,
        name: typeof m.name === 'string' ? m.name : m.name?.[locale] || m.name?.en || 'Payment Method',
        description:
          typeof m.description === 'string'
            ? m.description
            : m.description?.[locale] || m.description?.en || '',
        logo: m.logo || '',
        isActive: Boolean(m.isActive),
      })),
    [rawMethods, locale]
  );

  const selectedPreview = rawMethods.find((m) => m._id === previewId);

  const getLocalizedText = (value?: { en?: string; de?: string; ar?: string } | string) => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value[locale] || value.en || '';
  };

  const toggleActive = async (id: string, next: boolean) => {
    const target = rawMethods.find((m) => m._id === id);
    if (!target) return;

    const payload = {
      ...target,
      isActive: next,
    };

    const res = await fetch(`/api/payment-methods/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setRawMethods((prev) => prev.map((m) => (m._id === id ? { ...m, isActive: next } : m)));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Payment Methods</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Manage payment methods per country and global options.
          </p>
        </div>
        <button
          onClick={() => router.push('/en/dashboard/admin/payments/methods/new')}
          className="rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
        >
          New Method
        </button>
      </div>

      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-5 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
          Loading payment methods...
        </div>
      ) : (
        <PaymentMethodList
          items={methods}
          onPreview={(id) => setPreviewId(id)}
          onEdit={(id) => router.push(`/en/dashboard/admin/payments/methods/${id}/edit`)}
          onToggleActive={toggleActive}
        />
      )}

      <PaymentMethodPreviewModal
        open={Boolean(selectedPreview)}
        onClose={() => setPreviewId(null)}
        method={
          selectedPreview
            ? {
                name: getLocalizedText(selectedPreview.name),
                paymentAddress: selectedPreview.paymentAddress || '',
                instructions: getLocalizedText(selectedPreview.instructions),
                qrCodeBase64: selectedPreview.qrCode || '',
              }
            : undefined
        }
      />
    </div>
  );
}
