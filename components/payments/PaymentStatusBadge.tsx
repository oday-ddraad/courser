'use client';

import { useTranslations } from 'next-intl';
import type { PaymentStatus } from '@/types/database';


interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  className?: string;
}

const STATUS_STYLES: Record<PaymentStatus, string> = {
  pending:
    'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700',
  approved:
    'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
  rejected:
    'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
  cancelled:
    'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-700',
  expired:
    'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700',
  refunded:
    'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
};

const STATUS_LABEL_KEYS: Record<PaymentStatus, string> = {
  pending: 'status.pending',
  approved: 'status.approved',
  rejected: 'status.rejected',
  cancelled: 'status.cancelled',
  expired: 'status.expired',
  refunded: 'status.refunded',
};


export default function PaymentStatusBadge({
  status,
  className = '',
}: PaymentStatusBadgeProps) {
  const t = useTranslations('Payment');

  return (

    <span
      className={[
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium',
        STATUS_STYLES[status],
        className,
      ].join(' ')}
    >
      {t(STATUS_LABEL_KEYS[status] as never)}

    </span>
  );
}
