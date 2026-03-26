'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import PaymentStatusBadge from './PaymentStatusBadge';
import type { PaymentStatus } from '@/types/database';


interface AdminPaymentReviewModalProps {
  open: boolean;
  onClose: () => void;
  onApprove?: (adminNotes?: string) => Promise<void>;
  onReject?: (reason: string, adminNotes?: string) => Promise<void>;
  onRefund?: (reason: string) => Promise<void>;
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
  const [error, setError] = useState('');
  const t = useTranslations('Payment');
  const tt = (key: string, fallback: string) => (t.has(key) ? t(key) : fallback);


  useEffect(() => {
    if (!open) {
      setRejectionReason('');
      setAdminNotes('');
      setRefundReason('');
      setSubmitting(false);
      setError('');
    }
  }, [open]);

  if (!open || !payment) return null;

  const handleApprove = async () => {
    if (!onApprove) return;
    setSubmitting(true);
    setError('');
    try {
      await onApprove(adminNotes.trim() || undefined);
      onClose();
    } catch (err: any) {
      alert(`${tt('review.approveFailed', 'Approve failed')}: ${err.message || err.error || tt('review.unknownError', 'Unknown error')}`);
    } finally {

      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!onReject) return;
    const reason = rejectionReason.trim();
    if (!reason) return;
    setSubmitting(true);
    setError('');
    try {
      await onReject(reason, adminNotes.trim() || undefined);
      onClose();
    } catch (err: any) {
      alert(`${tt('review.rejectFailed', 'Reject failed')}: ${err.message || err.error || tt('review.unknownError', 'Unknown error')}`);
    } finally {

      setSubmitting(false);
    }
  };

  const handleRefund = async () => {
    if (!onRefund) return;
    const reason = refundReason.trim();
    if (!reason) return;
    setSubmitting(true);
    setError('');
    try {
      await onRefund(reason);
      onClose();
    } catch (err: any) {
      alert(`${tt('review.refundFailed', 'Refund failed')}: ${err.message || err.error || tt('review.unknownError', 'Unknown error')}`);
    } finally {

      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="w-full max-w-4xl rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
            <h3 className="text-lg font-semibold">{tt('review.title', 'Review Payment')}</h3>

            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
            >
              {tt('detail.close', 'Close')}

            </button>
          </div>

          <div className="max-h-[75vh] overflow-y-auto p-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <p className="text-sm"><span className="font-semibold">{tt('detail.course', 'Course')}:</span> {payment.courseName}</p>
                <p className="mt-2 text-sm">
                  <span className="font-semibold">{tt('detail.amount', 'Amount')}:</span> {payment.amount} {payment.currency}
                </p>
                <p className="mt-2 text-sm"><span className="font-semibold">{tt('detail.method', 'Method')}:</span> {payment.methodName}</p>
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <span className="font-semibold">{tt('detail.status', 'Status')}:</span>
                  <PaymentStatusBadge status={payment.status} />
                </div>
                {payment.operationNumber && (
                  <p className="mt-2 text-sm"><span className="font-semibold">{tt('detail.operationNumber', 'Operation #')}:</span> {payment.operationNumber}</p>
                )}
                {payment.rejectionReason && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                    <span className="font-semibold">{tt('review.lastRejection', 'Last rejection')}:</span> {payment.rejectionReason}
                  </p>
                )}

              </div>

              <div className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder={tt('review.adminNotesPlaceholder', 'Admin notes (internal only)')}
                  rows={3}
                />
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder={tt('review.rejectionReasonPlaceholder', 'Rejection reason (shown to student)')}
                  rows={3}
                />
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder={tt('review.refundReasonPlaceholder', 'Refund reason (shown to student)')}
                  rows={3}
                />

              </div>
            </div>

            {payment.screenshots?.length ? (
              <div className="mt-6">
                <h4 className="mb-3 text-sm font-semibold">{tt('review.receiptScreenshots', 'Receipt Screenshots')}</h4>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {payment.screenshots.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`${tt('detail.receiptAlt', 'Receipt')} ${idx + 1}`}

                      className="h-32 w-full cursor-pointer rounded-lg border border-gray-200 object-cover dark:border-gray-600 hover:ring-2 hover:ring-blue-500 transition-all"
                      onClick={() => window.open(img, '_blank', 'noopener,noreferrer')}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 dark:border-gray-700">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  ❌ {error}

                </p>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleApprove}
                disabled={submitting || !onApprove}
                className="flex-1 min-w-25 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? tt('review.processing', 'Processing...') : `✅ ${tt('review.approveButton', 'Approve')}`}

              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={submitting || !onReject || !rejectionReason.trim()}
                className="flex-1 min-w-25 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? tt('review.processing', 'Processing...') : `❌ ${tt('review.rejectButton', 'Reject')}`}

              </button>
              <button
                type="button"
                onClick={handleRefund}
                disabled={submitting || !onRefund || !refundReason.trim()}
                className="flex-1 min-w-25 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? tt('review.processing', 'Processing...') : `↩️ ${tt('review.refundButton', 'Refund')}`}

              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800 transition-colors"
              >
                {tt('review.cancelButton', 'Cancel')}

              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
