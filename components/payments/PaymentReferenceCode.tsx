'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';


interface PaymentReferenceCodeProps {
  code: string;
  className?: string;
}

export default function PaymentReferenceCode({ code, className = '' }: PaymentReferenceCodeProps) {
  const t = useTranslations('Payment');
  const [copied, setCopied] = useState(false);


  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className={[
        'rounded-lg border border-dashed border-blue-300 bg-blue-50 p-3 dark:border-blue-700 dark:bg-blue-900/20',
        className,
      ].join(' ')}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-blue-700 dark:text-blue-300">{t('referenceCodeLabel')}</p>

      <div className="mt-1 flex items-center gap-2">
        <code className="rounded bg-white px-2 py-1 text-sm font-semibold text-blue-900 dark:bg-gray-900 dark:text-blue-200">
          {code}
        </code>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded border border-blue-300 px-2 py-1 text-xs hover:bg-blue-100 dark:border-blue-700 dark:hover:bg-blue-900/40"
        >
          {copied ? t('copied') : t('copy')}

        </button>
      </div>
    </div>
  );
}
