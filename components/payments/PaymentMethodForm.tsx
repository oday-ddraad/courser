'use client';

import { useState } from 'react';

export interface PaymentMethodFormValues {
  name: string;
  description?: string;
  instructions?: string;
  type: 'bank_transfer' | 'mobile_wallet' | 'crypto' | 'paypal' | 'custom';
  paymentAddress: string;
  logo: string;
  qrCode?: string;
  isGlobal: boolean;
  countries: string[];
  countryInput?: string;
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
    type: initialValues?.type ?? 'bank_transfer',
    paymentAddress: initialValues?.paymentAddress ?? '',
    logo: initialValues?.logo ?? '',
    qrCode: initialValues?.qrCode ?? '',
    isGlobal: initialValues?.isGlobal ?? true,
    countries: initialValues?.countries ?? [],
    countryInput: '',
    requiresOperationNumber: initialValues?.requiresOperationNumber ?? true,
    requiresScreenshot: initialValues?.requiresScreenshot ?? true,
    isActive: initialValues?.isActive ?? true,
  });

  const set = <K extends keyof PaymentMethodFormValues>(key: K, value: PaymentMethodFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const fileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });

  const handleImageUpload = async (file: File | undefined, field: 'logo' | 'qrCode') => {
    if (!file) return;
    const base64 = await fileToBase64(file);
    set(field, base64);
  };

  const addCountry = () => {
    const code = (values.countryInput || '').trim().toUpperCase();
    if (!code) return;
    if (values.countries.includes(code)) return;

    setValues((prev) => ({
      ...prev,
      countries: [...prev.countries, code],
      countryInput: '',
    }));
  };

  const removeCountry = (code: string) => {
    setValues((prev) => ({
      ...prev,
      countries: prev.countries.filter((c) => c !== code),
    }));
  };

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
        <label className="mb-1 block text-sm font-medium">Payment Type</label>
        <select
          value={values.type}
          onChange={(e) => set('type', e.target.value as PaymentMethodFormValues['type'])}
          required
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
        >
          <option value="bank_transfer">Bank Transfer</option>
          <option value="mobile_wallet">Mobile Wallet</option>
          <option value="crypto">Crypto</option>
          <option value="paypal">PayPal</option>
          <option value="custom">Custom</option>
        </select>
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

      <div>
        <label className="mb-1 block text-sm font-medium">Instructions</label>
        <textarea
          value={values.instructions}
          onChange={(e) => set('instructions', e.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Logo (required)</label>
        <input
          type="file"
          accept="image/*"
          onChange={async (e) => {
            try {
              await handleImageUpload(e.target.files?.[0], 'logo');
            } catch {
              // fallback to manual paste
            }
          }}
          className="mb-2 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
        />
        <textarea
          value={values.logo}
          onChange={(e) => set('logo', e.target.value)}
          placeholder="Paste logo as base64 (data:image/...)"
          required
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">QR Code (optional)</label>
        <input
          type="file"
          accept="image/*"
          onChange={async (e) => {
            try {
              await handleImageUpload(e.target.files?.[0], 'qrCode');
            } catch {
              // fallback to manual paste
            }
          }}
          className="mb-2 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
        />
        <textarea
          value={values.qrCode || ''}
          onChange={(e) => set('qrCode', e.target.value)}
          placeholder="Paste QR code as base64 (data:image/...)"
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
        />
      </div>

      <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
        <label className="mb-2 flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={values.isGlobal}
            onChange={(e) => set('isGlobal', e.target.checked)}
          />
          Global method (available in all countries)
        </label>

        {!values.isGlobal && (
          <div className="space-y-2">
            <label className="mb-1 block text-sm font-medium">Countries (ISO code, e.g. DE, SY, AE)</label>
            <div className="flex gap-2">
              <input
                value={values.countryInput || ''}
                onChange={(e) => set('countryInput', e.target.value)}
                placeholder="Enter country code"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm uppercase dark:border-gray-700 dark:bg-gray-900"
              />
              <button
                type="button"
                onClick={addCountry}
                className="rounded bg-gray-800 px-3 py-2 text-sm text-white hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                Add
              </button>
            </div>

            {values.countries.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {values.countries.map((code) => (
                  <span
                    key={code}
                    className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                  >
                    {code}
                    <button
                      type="button"
                      onClick={() => removeCountry(code)}
                      className="text-blue-700 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-100"
                      aria-label={`Remove ${code}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {values.countries.length === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Add at least one country when Global method is disabled.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
