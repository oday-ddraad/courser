'use client';

import { useState } from 'react';

export interface PaymentMethodFormValues {
  name: string;
  description?: string;
  instructions?: string;
  paymentAddress: string;
  isGlobal: boolean;
  countries: string[];
  requiresOperationNumber: boolean;
  requiresScreenshot: boolean;
  isActive: boolean;
}

interface PaymentMethodFormProps {
  initialValues?: Partial<PaymentMethodFormValues>;
  onSubmit?: (values: PaymentMethodFormValues) => void;
  className?: string;
}

export default function PaymentMethodForm({
  initialValues,
  onSubmit,
  className = '',
}: PaymentMethodFormProps) {
  const [values, setValues] = useState<PaymentMethodFormValues>({
    name: initialValues?.name ?? '',
    description: initialValues?.description ?? '',
    instructions: initialValues?.instructions ?? '',
    paymentAddress: initialValues?.paymentAddress ?? '',
    isGlobal: initialValues?.isGlobal ?? true,
    countries: initialValues?.countries ?? [],
    requiresOperationNumber: initialValues?.requiresOperationNumber ?? true,
    requiresScreenshot: initialValues?.requiresScreenshot ?? true,
    isActive: initialValues?.isActive ?? true,
  });

  const set = <K extends keyof PaymentMethodFormValues>(key: K, value: PaymentMethodFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  return (
    <form
      className={['space-y-4 rounded-xl border border-gray-200 p-4 dark:border-gray-700', className].join(' ')}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.(values);
      }}
    >
      <div>
        <label className="mb-1 block text-sm font-medium">Method Name</label>
        <input
          value={values.name}
          onChange={(e) => set('name', e.target.value)}
          required
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Payment Address</label>
        <input
          value={values.paymentAddress}
          onChange={(e) => set('paymentAddress', e.target.value)}
          required
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Description</label>
        <textarea
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={values.isGlobal}
            onChange={(e) => set('isGlobal', e.target.checked)}
          />
          Global method
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={values.isActive}
            onChange={(e) => set('isActive', e.target.checked)}
          />
          Active
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={values.requiresOperationNumber}
            onChange={(e) => set('requiresOperationNumber', e.target.checked)}
          />
          Require operation number
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={values.requiresScreenshot}
            onChange={(e) => set('requiresScreenshot', e.target.checked)}
          />
          Require screenshot
        </label>
      </div>

      <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
        Save Payment Method
      </button>
    </form>
  );
}
