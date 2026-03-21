'use client';

import { useEffect, useState } from 'react';
import PaymentStatusBadge from './PaymentStatusBadge';
import type { PaymentStatus } from '@/types/database';

interface AdminPaymentReviewModalProps {
  open: boolean;
  onClose: () => void;
  onApprove?: (adminNotes?: string) => Promise<void> | void;
  onReject?: (reason: string, adminNotes?: string) => Promise<void> | void;
  onRefund?: (reason: string) => Promise<void> | void;
  payment?: {
    id: string;
    courseName: string;
    amount: number;
    currency: string;
    methodName: string;
    status: PaymentStatus;
    operationNumber?: string;
    screenshots?: string[];
    rejectionReason?: string;
  };
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
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setRejectionReason('');
      setAdminNotes('');
      setRefundReason('');
      setSubmitting(false);
    }
  }, [open]);

  if (!open || !payment) return null;

  const handleApprove = async () => {
    if (!onApprove) return;
    setSubmitting(true);
    try {
      await onApprove(adminNotes.trim() || undefined);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!onReject) return;
    const reason = rejectionReason.trim();
    if (!reason) return;
    setSubmitting(true);
    try {
      await onReject(reason, adminNotes.trim() || undefined);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefund = async () => {
    if (!onRefund) return;
    const reason = refundReason.trim();
    if (!reason) return;
    setSubmitting(true);
    try {
      await onRefund(reason);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/50" onClick={onClose}>
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="w-full max-w-4xl rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
            <h3 className="text-lg font-semibold">Review Payment</h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
            >
              Close
            </button>
          </div>

          <div className="max-h-[75vh] overflow-y-auto p-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <p className="text-sm"><span className="font-semibold">Course:</span> {payment.courseName}</p>
                <p className="mt-2 text-sm">
                  <span className="font-semibold">Amount:</span> {payment.amount} {payment.currency}
                </p>
                <p className="mt-2 text-sm"><span className="font-semibold">Method:</span> {payment.methodName}</p>
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <span className="font-semibold">Status:</span>
                  <PaymentStatusBadge status={payment.status} />
                </div>
                {payment.operationNumber ? (
                  <p className="mt-2 text-sm"><span className="font-semibold">Operation #:</span> {payment.operationNumber}</p>
                ) : null}
                {payment.rejectionReason ? (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                    <span className="font-semibold">Last rejection reason:</span> {payment.rejectionReason}
                  </p>
                ) : null}
              </div>

              <div className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                  placeholder="Admin notes (internal)"
                  rows={3}
                />
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                  placeholder="Rejection reason (required for reject)"
                  rows={3}
                />
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                  placeholder="Refund reason (required for refund)"
                  rows={3}
                />
              </div>
            </div>

            {payment.screenshots?.length ? (
              <div className="mt-4">
                <h4 className="mb-2 text-sm font-semibold">Receipt Screenshots</h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {payment.screenshots.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`receipt-${idx + 1}`}
                      className="h-40 w-full rounded-lg border border-gray-200 object-cover dark:border-gray-700"
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-gray-200 px-5 py-4 dark:border-gray-700">
            <button
              type="button"
              onClick={handleApprove}
              disabled={submitting || !onApprove}
              className="rounded-md bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={handleReject}
              disabled={submitting || !onReject || !rejectionReason.trim()}
              className="rounded-md bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
            >
              Reject
            </button>
            <button
              type="button"
              onClick={handleRefund}
              disabled={submitting || !onRefund || !refundReason.trim()}
              className="rounded-md bg-amber-600 px-3 py-2 text-sm text-white hover:bg-amber-700 disabled:opacity-50"
            >
              Refund
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
