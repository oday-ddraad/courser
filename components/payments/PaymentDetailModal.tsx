'use client';

import PaymentStatusBadge from './PaymentStatusBadge';
import type { PaymentStatus } from '@/types/database';

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
  if (!open || !payment) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className={['w-full max-w-2xl rounded-xl bg-white p-4 shadow-lg dark:bg-gray-900', className].join(' ')}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Payment Details</h3>
          <button type="button" onClick={onClose} className="rounded border px-2 py-1 text-xs">Close</button>
        </div>

        <div className="space-y-2 text-sm">
          <p><strong>Course:</strong> {payment.courseName}</p>
          <p><strong>Amount:</strong> {payment.amount} {payment.currency}</p>
          <p><strong>Method:</strong> {payment.methodName}</p>
          <div className="flex items-center gap-2"><strong>Status:</strong> <PaymentStatusBadge status={payment.status} /></div>
          {payment.operationNumber ? <p><strong>Operation #:</strong> {payment.operationNumber}</p> : null}
          {payment.rejectionReason ? <p className="text-red-600"><strong>Reason:</strong> {payment.rejectionReason}</p> : null}
        </div>

        {payment.screenshots?.length ? (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {payment.screenshots.map((img, idx) => (
              <img key={idx} src={img} alt={`receipt-${idx + 1}`} className="h-32 w-full rounded border object-cover" />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
