'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import {

  COMPRESSION_PRESETS,
  compressImage,
  type CompressionOptions,
  type CompressedImageResult,
} from '@/lib/utils/imageCompression';

interface ReceiptUploaderProps {
  multiple?: boolean;
  maxFiles?: number;
  preset?: keyof typeof COMPRESSION_PRESETS;
  customOptions?: CompressionOptions;
  value?: string[];
  onChange?: (base64Images: string[], meta: CompressedImageResult[]) => void;
  className?: string;
}

export default function ReceiptUploader({
  multiple = true,
  maxFiles = 3,
  preset = 'receipt',
  customOptions,
  value = [],
  onChange,
  className = '',
}: ReceiptUploaderProps) {
  const t = useTranslations('Payment');
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const options = customOptions ?? COMPRESSION_PRESETS[preset];

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setError('');
    setIsProcessing(true);

    try {
      const selected = Array.from(files).slice(0, maxFiles);
      const results = await Promise.all(selected.map((file) => compressImage(file, options)));
      const next = results.map((r) => r.base64);
      onChange?.(next, results);
    } catch (err: any) {
      setError(err?.message || t('errors.imageProcessFailed'));

    } finally {
      setIsProcessing(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isProcessing}
        className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:hover:bg-gray-800"
      >
        {isProcessing ? t('receiptUploader.processing') : t('receiptUploader.upload')}
      </button>


      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {value.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {value.map((img, idx) => (
            <img key={`${idx}-${img.slice(0, 24)}`} src={img} alt={`receipt-${idx + 1}`} className="h-24 w-full rounded border object-cover" />
          ))}
        </div>
      ) : null}
    </div>
  );
}
