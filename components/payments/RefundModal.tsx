'use client';

import { useState } from 'react';

interface RefundModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm?: (reason: string) => void;
  className?: string;
}

export default function RefundModal({
  open,
  onClose,
  onConfirm,
  className = '',
}: RefundModalProps) {
  const [reason, setReason] = useState('');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className={['w-full max-w-md rounded-xl bg-white p-4 shadow-lg dark:bg-gray-900', className].join(' ')}>
        <h3 className="text-lg font-semibold">Refund Payment</h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Provide a reason for this refund. This will be visible in records and notifications.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="mt-3 w-full rounded border border-gray-300 p-2 text-sm dark:border-gray-700 dark:bg-gray-800"
          placeholder="Refund reason"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded border px-3 py-2 text-sm">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm?.(reason)}
            className="rounded bg-amber-600 px-3 py-2 text-sm text-white hover:bg-amber-700"
          >
            Confirm Refund
          </button>
        </div>
      </div>
    </div>
  );
}
