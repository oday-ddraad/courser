'use client';

import PaymentStatusBadge from './PaymentStatusBadge';
import type { PaymentStatus } from '@/types/database';
import { useTranslations } from 'next-intl';


interface PaymentDetailModalProps {
  open: boolean;
  onClose: () => void;
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
  className?: string;
}

export default function PaymentDetailModal({
  open,
  onClose,
  payment,
  className = '',
}: PaymentDetailModalProps) {
  const t = useTranslations('Payment');
  const tt = (key: string, fallback: string) => (t.has(key) ? t(key) : fallback);

  if (!open || !payment) return null;


  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className={['w-full max-w-2xl rounded-xl bg-white p-4 shadow-lg dark:bg-gray-900', className].join(' ')}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{tt('detail.title', 'Payment Details')}</h3>
          <button type="button" onClick={onClose} className="rounded border px-2 py-1 text-xs">
            {tt('detail.close', 'Close')}
          </button>

        </div>

        <div className="space-y-2 text-sm">
          <p><strong>{tt('detail.course', 'Course')}:</strong> {payment.courseName}</p>
          <p><strong>{tt('detail.amount', 'Amount')}:</strong> {payment.amount} {payment.currency}</p>
          <p><strong>{tt('detail.method', 'Method')}:</strong> {payment.methodName}</p>
          <div className="flex items-center gap-2"><strong>{tt('detail.status', 'Status')}:</strong> <PaymentStatusBadge status={payment.status} /></div>
          {payment.operationNumber ? <p><strong>{tt('detail.operationNumber', 'Operation #')}:</strong> {payment.operationNumber}</p> : null}
          {payment.rejectionReason ? <p className="text-red-600"><strong>{tt('detail.reason', 'Reason')}:</strong> {payment.rejectionReason}</p> : null}

        </div>

        {payment.screenshots?.length ? (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {payment.screenshots.map((img, idx) => (
              <img key={idx} src={img} alt={`${tt('detail.receiptAlt', 'receipt')}-${idx + 1}`} className="h-32 w-full rounded border object-cover" />

            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
