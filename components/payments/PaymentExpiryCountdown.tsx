'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';


interface PaymentExpiryCountdownProps {
  expiresAt: string | Date;
  className?: string;
}

function formatMs(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function PaymentExpiryCountdown({ expiresAt, className = '' }: PaymentExpiryCountdownProps) {
  const t = useTranslations('Payment');
  const target = useMemo(() => new Date(expiresAt).getTime(), [expiresAt]);

  const [left, setLeft] = useState(Math.max(0, target - Date.now()));

  useEffect(() => {
    const id = setInterval(() => {
      setLeft(Math.max(0, target - Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [target]);

  const isExpired = left <= 0;

  return (
    <div className={['rounded-lg border p-3 text-sm', isExpired ? 'border-red-300 bg-red-50 text-red-700' : 'border-amber-300 bg-amber-50 text-amber-700', className].join(' ')}>
      {isExpired ? t('expiryExpired') : t('expiryIn', { time: formatMs(left) })}

    </div>
  );
}
