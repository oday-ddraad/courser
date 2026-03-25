'use client';

import { useState } from 'react';
import ReceiptUploader from './ReceiptUploader';

interface PaymentProofFormProps {
  onSubmit?: (payload: { operationNumber?: string; receiptImages: string[] }) => void;
  requireOperationNumber?: boolean;
  className?: string;
}

export default function PaymentProofForm({
  onSubmit,
  requireOperationNumber = true,
  className = '',
}: PaymentProofFormProps) {
  const [operationNumber, setOperationNumber] = useState('');
  const [receiptImages, setReceiptImages] = useState<string[]>([]);

  return (
    <form
      className={['space-y-4', className].join(' ')}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.({ operationNumber, receiptImages });
      }}
    >
      <div>
        <label className="mb-1 block text-sm font-medium">Operation Number</label>
        <input
          value={operationNumber}
          onChange={(e) => setOperationNumber(e.target.value)}
          required={requireOperationNumber}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          placeholder="Enter transfer/operation number"
        />
      </div>

      <ReceiptUploader value={receiptImages} onChange={(images) => setReceiptImages(images)} />

      <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
        Submit Payment Proof
      </button>
    </form>
  );
}
