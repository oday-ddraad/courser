'use client';

import PaymentStatusBadge from './PaymentStatusBadge';
import PaymentExpiryCountdown from './PaymentExpiryCountdown';
import type { PaymentStatus } from '@/types/database';

interface PaymentStatusBannerProps {
  status: PaymentStatus;
  message?: string;
  expiresAt?: string | Date;
  className?: string;
}

export default function PaymentStatusBanner({
  status,
  message,
  expiresAt,
  className = '',
}: PaymentStatusBannerProps) {
  return (
    <div className={['rounded-xl border border-gray-200 p-4 dark:border-gray-700', className].join(' ')}>
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold">Payment Status</h4>
        <PaymentStatusBadge status={status} />
      </div>

      {message ? <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{message}</p> : null}

      {status === 'pending' && expiresAt ? (
        <div className="mt-3">
          <PaymentExpiryCountdown expiresAt={expiresAt} />
        </div>
      ) : null}
    </div>
  );
}
