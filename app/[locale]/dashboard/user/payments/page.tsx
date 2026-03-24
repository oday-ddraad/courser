'use client';

import { useEffect, useMemo, useState } from 'react';
import PaymentHistoryTable from '@/components/payments/PaymentHistoryTable';
import PaymentDetailModal from '@/components/payments/PaymentDetailModal';


interface PaymentRow {
  _id: string;
  referenceCode?: string;
  status: string;
  amount: number;
  currency: string;
  operationNumber?: string;
  createdAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
  receiptScreenshots?: string[];
  courseId?: { _id?: string; title?: { en?: string; de?: string; ar?: string } } | string;
  paymentMethodId?: { _id?: string; name?: { en?: string; de?: string; ar?: string } } | string;
}


export default function UserPaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [activePaymentId, setActivePaymentId] = useState<string | null>(null);


  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/payments?limit=100', { cache: 'no-store' });
      const json = await res.json();
      if (res.ok && json?.success) {
        setPayments(json.data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, []);

  const rows = useMemo(
    () =>
      payments.map((p) => ({
        id: p._id,
        referenceCode: p.referenceCode || '-',
        courseName:
          typeof p.courseId === 'object'
            ? p.courseId?.title?.en || p.courseId?.title?.de || p.courseId?.title?.ar || '-'
            : '-',
        amount: p.amount,
        currency: p.currency,
        methodName:
          typeof p.paymentMethodId === 'object'
            ? p.paymentMethodId?.name?.en || p.paymentMethodId?.name?.de || p.paymentMethodId?.name?.ar || '-'
            : '-',
        status: p.status as any,
        operationNumber: p.operationNumber || '-',
        submittedAt: p.createdAt,
        reviewedAt: p.reviewedAt || '',
      })),
    [payments]
  );


  const totalPaid = useMemo(
    () =>
      payments
        .filter((p) => p.status === 'approved')
        .reduce((sum, p) => sum + Number(p.amount || 0), 0),
    [payments]
  );

  const pendingCount = useMemo(
    () => payments.filter((p) => p.status === 'pending').length,
    [payments]
  );

  const activePayment = useMemo(() => {
    if (!activePaymentId) return null;
    const p = payments.find((item) => item._id === activePaymentId);
    if (!p) return null;

    return {
      id: p._id,
      courseName:
        typeof p.courseId === 'object'
          ? p.courseId?.title?.en || p.courseId?.title?.de || p.courseId?.title?.ar || '-'
          : '-',
      amount: p.amount,
      currency: p.currency,
      methodName:
        typeof p.paymentMethodId === 'object'
          ? p.paymentMethodId?.name?.en || p.paymentMethodId?.name?.de || p.paymentMethodId?.name?.ar || '-'
          : '-',
      status: p.status as any,
      operationNumber: p.operationNumber,
      screenshots: p.receiptScreenshots || [],
      rejectionReason: p.rejectionReason,
    };
  }, [activePaymentId, payments]);

  return (

    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Payments</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          View your payment status, history, and references.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <p className="text-xs text-gray-500">Total Payments</p>
          <p className="mt-1 text-xl font-semibold">{payments.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <p className="text-xs text-gray-500">Pending</p>
          <p className="mt-1 text-xl font-semibold">{pendingCount}</p>
        </div>
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <p className="text-xs text-gray-500">Approved Total</p>
          <p className="mt-1 text-xl font-semibold">{totalPaid}</p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-5 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
          Loading payment history...
        </div>
      ) : (

        <PaymentHistoryTable
          rows={rows as any}
          onView={(id) => setActivePaymentId(id)}
          onResubmit={async (id) => {
            try {
              const res = await fetch(`/api/payments/${id}/submit`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
              });
              if (!res.ok) {
                const error = await res.json();
                alert(`Resubmit failed: ${error.error || 'Unknown error'}`);
                return;
              }
              // Redirect to payment page
              window.location.href = `/en/payment/${id}`;
            } catch (e) {
              alert(`Resubmit failed`);
            }
          }}
        />


      )}

      <PaymentDetailModal
        open={Boolean(activePayment)}
        payment={activePayment || undefined}
        onClose={() => setActivePaymentId(null)}
      />
    </div>
  );
}
