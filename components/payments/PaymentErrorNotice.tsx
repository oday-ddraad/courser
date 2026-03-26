'use client';

import { useTranslations } from 'next-intl';
import { UserRole } from '@/types/database';

interface PaymentErrorNoticeProps {
  message?: string | null;
  role?: UserRole | string | null;
  className?: string;
}

export default function PaymentErrorNotice({
  message,
  role,
  className = '',
}: PaymentErrorNoticeProps) {
  if (!message) return null;

  const t = useTranslations('Payment');
  const isAdmin = role === 'admin';

  const tt = (key: string, fallback: string) => {
    try {
      return t(key as never);
    } catch {
      return fallback;
    }
  };

  const title = isAdmin
    ? tt('errors.adminTitle', 'Payment operation failed')
    : tt('errors.userTitle', 'Something went wrong');

  const description = isAdmin
    ? message
    : tt('errors.userGeneric', 'We could not process your request right now. Please try again.');


  return (
    <div
      className={[
        'rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20',
        className,
      ].join(' ')}
      role="alert"
      aria-live="polite"
    >
      <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">{title}</h3>
      <p className="mt-1 text-sm text-red-700 dark:text-red-300">{description}</p>
    </div>
  );
}
