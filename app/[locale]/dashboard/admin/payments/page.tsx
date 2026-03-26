'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import AdminPaymentStats from '@/components/payments/AdminPaymentStats';

import PaymentUrgencyIndicator from '@/components/payments/PaymentUrgencyIndicator';
import AdminPaymentReviewModal from '@/components/payments/AdminPaymentReviewModal';
import BulkApproveButton from '@/components/payments/BulkApproveButton';
import PaymentStatusBadge from '@/components/payments/PaymentStatusBadge';
import PaymentErrorNotice from '@/components/payments/PaymentErrorNotice';


interface PaymentRow {
  _id: string;
  referenceCode?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'expired' | 'refunded';
  createdAt?: string;
  operationNumber?: string;
  rejectionReason?: string;
  receiptScreenshots?: string[];
  userId?: { _id: string; name?: string; email?: string } | string;
  courseId?: { _id: string; title?: any } | string;
  paymentMethodId?: { _id: string; name?: any; type?: string } | string;
}

export default function AdminPaymentsPage() {
  const { data: session } = useSession();
  const t = useTranslations('Payment');
  const tt = (key: string, fallback: string) => {
    try {
      return t(key as never);
    } catch {
      return fallback;
    }
  };

  const [loading, setLoading] = useState(true);

  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activePayment, setActivePayment] = useState<PaymentRow | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const pendingIds = useMemo(
    () => payments.filter((p) => p.status === 'pending').map((p) => p._id),
    [payments]
  );

  const selectedPendingIds = useMemo(
    () => selectedIds.filter((id) => pendingIds.includes(id)),
    [selectedIds, pendingIds]
  );

  const totalRevenue = payments
    .filter((p) => p.status === 'approved')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const pendingCount = payments.filter((p) => p.status === 'pending').length;
  const approvedCount = payments.filter((p) => p.status === 'approved').length;
  const todayRevenue = payments
    .filter((p) => {
      if (p.status !== 'approved' || !p.createdAt) return false;
      const d = new Date(p.createdAt);
      const now = new Date();
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    })
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/payments?limit=50', { cache: 'no-store' });
      const json = await res.json();
      if (res.ok && json?.success) {
        setPayments(json.data || []);
      } else {
        setError(json?.error || tt('errors.loadFailed', 'Failed to load payments'));
      }
    } catch {
      setError(tt('errors.loadFailed', 'Failed to load payments'));

    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchPayments();
  }, [refreshTick]);

  useEffect(() => {
    const id = setInterval(() => setRefreshTick((v) => v + 1), 10000);
    return () => clearInterval(id);
  }, []);

  const toggleSelect = (paymentId: string) => {
    setSelectedIds((prev) =>
      prev.includes(paymentId) ? prev.filter((id) => id !== paymentId) : [...prev, paymentId]
    );
  };

  const toggleSelectAllPending = () => {
    if (selectedPendingIds.length === pendingIds.length && pendingIds.length > 0) {
      setSelectedIds((prev) => prev.filter((id) => !pendingIds.includes(id)));
      return;
    }
    setSelectedIds((prev) => Array.from(new Set([...prev, ...pendingIds])));
  };

  const handleBulkApprove = async () => {
    if (selectedPendingIds.length === 0) return;
    setError(null);
    const res = await fetch('/api/payments/bulk-approve', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentIds: selectedPendingIds }),
    });
    if (res.ok) {
      setSelectedIds([]);
      setRefreshTick((v) => v + 1);
    } else {
      const json = await res.json().catch(() => ({}));
      setError(json?.error || tt('errors.bulkApproveFailed', 'Failed to bulk approve payments'));
    }

  };


  const handleExport = () => {
    window.open('/api/payments/export?format=csv', '_blank');
  };

  const handleApprove = async (adminNotes?: string) => {
    if (!activePayment) return;
    setError(null);
    const res = await fetch(`/api/payments/${activePayment._id}/approve`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminNotes: adminNotes || '' }),
    });

    if (res.ok) {
      setActivePayment(null);
      setRefreshTick((v) => v + 1);
    } else {
      const json = await res.json().catch(() => ({}));
      setError(json?.error || tt('errors.approveFailed', 'Failed to approve payment'));
    }
  };


  const handleReject = async (reason: string, adminNotes?: string) => {
    if (!activePayment) return;
    setError(null);
    const res = await fetch(`/api/payments/${activePayment._id}/reject`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, adminNotes: adminNotes || '' }),
    });

    if (res.ok) {
      setActivePayment(null);
      setRefreshTick((v) => v + 1);
    } else {
      const json = await res.json().catch(() => ({}));
      setError(json?.error || tt('errors.rejectFailed', 'Failed to reject payment'));
    }

  };


  const handleRefund = async (reason: string) => {
    if (!activePayment) return;
    setError(null);
    const res = await fetch(`/api/payments/${activePayment._id}/refund`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refundReason: reason }),
    });

    if (res.ok) {
      setActivePayment(null);
      setRefreshTick((v) => v + 1);
    } else {
      const json = await res.json().catch(() => ({}));
      setError(json?.error || tt('errors.refundFailed', 'Failed to refund payment'));
    }

  };


  const reviewPayment = activePayment
    ? {
        id: activePayment._id,
        courseName:
          typeof activePayment.courseId === 'string'
            ? activePayment.courseId
            : activePayment.courseId?.title?.en ||
              activePayment.courseId?.title?.de ||
              activePayment.courseId?.title?.ar ||
              '-',
        amount: activePayment.amount || 0,
        currency: activePayment.currency || 'USD',
        methodName:
          typeof activePayment.paymentMethodId === 'string'
            ? activePayment.paymentMethodId
            : activePayment.paymentMethodId?.name?.en ||
              activePayment.paymentMethodId?.name?.de ||
              activePayment.paymentMethodId?.name?.ar ||
              activePayment.paymentMethodId?.type ||
              '-',
        status: activePayment.status,
        operationNumber: activePayment.operationNumber,
        screenshots: activePayment.receiptScreenshots || [],
        rejectionReason: activePayment.rejectionReason,
      }
    : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payments</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Review, approve, reject, refund, and export payment operations.
        </p>
      </div>

      <PaymentErrorNotice
        message={error}
        role={session?.user?.role}
      />

      <AdminPaymentStats

        totalRevenue={totalRevenue}
        pendingCount={pendingCount}
        approvedCount={approvedCount}
        todayRevenue={todayRevenue}
      />

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
        <button
          onClick={toggleSelectAllPending}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
        >
          {selectedPendingIds.length === pendingIds.length && pendingIds.length > 0
            ? 'Unselect Pending'
            : 'Select All Pending'}
        </button>

        <BulkApproveButton
          selectedCount={selectedPendingIds.length}
          disabled={selectedPendingIds.length === 0}
          onClick={handleBulkApprove}
        />

        <button
          onClick={handleExport}
          className="rounded-md bg-gray-900 px-3 py-2 text-sm text-white hover:bg-black dark:bg-gray-100 dark:text-gray-900"
        >
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900/40">
            <tr>
              <th className="px-4 py-3 text-left">Select</th>
              <th className="px-4 py-3 text-left">Urgency</th>
              <th className="px-4 py-3 text-left">Reference</th>
              <th className="px-4 py-3 text-left">Student</th>
              <th className="px-4 py-3 text-left">Amount</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Created</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-center text-gray-500" colSpan={8}>
                  Loading payments...
                </td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-gray-500" colSpan={8}>
                  No payments found.
                </td>
              </tr>
            ) : (
              payments.map((payment) => {
                const userName =
                  typeof payment.userId === 'string'
                    ? payment.userId
                    : payment.userId?.name || payment.userId?.email || 'Unknown Student';


                return (
                  <tr key={payment._id} className="border-t border-gray-100 dark:border-gray-700">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(payment._id)}
                        onChange={() => toggleSelect(payment._id)}
                        className="h-4 w-4"
                      />
                    </td>
                    <td className="px-4 py-3">
                      {payment.createdAt ? (
                        <PaymentUrgencyIndicator createdAt={payment.createdAt} status={payment.status} />
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{payment.referenceCode || '-'}</td>
                    <td className="px-4 py-3">{userName}</td>
                    <td className="px-4 py-3">
                      {new Intl.NumberFormat(undefined, {
                        style: 'currency',
                        currency: payment.currency || 'USD',
                      }).format(payment.amount || 0)}
                    </td>
                    <td className="px-4 py-3">
                      <PaymentStatusBadge status={payment.status} />
                    </td>
                    <td className="px-4 py-3">
                      {payment.createdAt ? new Date(payment.createdAt).toLocaleString() : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setActivePayment(payment)}
                        className="rounded-md bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {activePayment ? (
        <AdminPaymentReviewModal
          open={Boolean(activePayment)}
          payment={reviewPayment}
          onApprove={handleApprove}
          onReject={handleReject}
          onRefund={handleRefund}
          onClose={() => setActivePayment(null)}
        />
      ) : null}
    </div>
  );
}
