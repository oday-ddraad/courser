'use client';

import { useState } from 'react';
import PaymentDetailModal from './PaymentDetailModal';

interface AdminPaymentReviewModalProps {
  open: boolean;
  onClose: () => void;
  onApprove?: (adminNotes?: string) => void;
  onReject?: (reason: string, adminNotes?: string) => void;
  onRefund?: (reason: string) => void;
  payment?: Parameters<typeof PaymentDetailModal>[0]['payment'];
}

export default function AdminPaymentReviewModal({
  open,
  onClose,
  onApprove,
  onReject,
  onRefund,
  payment,
}: AdminPaymentReviewModalProps) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [refundReason, setRefundReason] = useState('');

  if (!open || !payment) return null;

  return (
    <div className="fixed inset-0 z-60 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-xl bg-white p-4 shadow-lg dark:bg-gray-900">
        <PaymentDetailModal open={true} onClose={onClose} payment={payment} />
        <div className="mt-4 space-y-3">
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            className="w-full rounded border p-2 text-sm dark:border-gray-700 dark:bg-gray-800"
            placeholder="Admin notes (internal)"
          />
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="w-full rounded border p-2 text-sm dark:border-gray-700 dark:bg-gray-800"
            placeholder="Rejection reason"
          />
          <textarea
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
            className="w-full rounded border p-2 text-sm dark:border-gray-700 dark:bg-gray-800"
            placeholder="Refund reason"
          />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => onApprove?.(adminNotes)} className="rounded bg-green-600 px-3 py-2 text-sm text-white">
              Approve
            </button>
            <button
              type="button"
              onClick={() => onReject?.(rejectionReason, adminNotes)}
              className="rounded bg-red-600 px-3 py-2 text-sm text-white"
            >
              Reject
            </button>
            <button
              type="button"
              onClick={() => onRefund?.(refundReason)}
              className="rounded bg-amber-600 px-3 py-2 text-sm text-white"
            >
              Refund
            </button>
            <button type="button" onClick={onClose} className="rounded border px-3 py-2 text-sm">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
