'use client';

import Image from 'next/image';
import { Download } from 'lucide-react';
import { useTranslations } from 'next-intl';


interface QRCodeDisplayProps {
  qrCodeBase64?: string;
  alt?: string;
  fileName?: string;
  className?: string;
}

export default function QRCodeDisplay({
  qrCodeBase64,
  alt,
  fileName = 'payment-qr.png',
  className = '',
}: QRCodeDisplayProps) {
  const t = useTranslations('Payment');
  const resolvedAlt = alt || t('qrAlt');

  const handleDownload = () => {

    if (!qrCodeBase64) return;

    const link = document.createElement('a');
    link.href = qrCodeBase64;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!qrCodeBase64) {
    return (
      <div
        className={`flex min-h-45 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900/20 dark:text-gray-400 ${className}`}
      >
        {t('noQrAvailable')}

      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="relative mx-auto h-48 w-48 overflow-hidden rounded-lg border border-gray-200 bg-white p-2 dark:border-gray-700">
        <Image src={qrCodeBase64} alt={resolvedAlt} fill className="object-contain p-2" unoptimized />

      </div>

      <button
        type="button"
        onClick={handleDownload}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
      >
        <Download className="h-4 w-4" />
        {t('downloadQr')}

      </button>
    </div>
  );
}
