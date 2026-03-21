'use client';

import React from 'react';

interface PaymentUrgencyIndicatorProps {
  createdAt: string | Date;
  status?: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'expired' | 'refunded';
  showLabel?: boolean;
  className?: string;
}

type UrgencyLevel = 'normal' | 'warning' | 'critical';

function getUrgency(createdAt: string | Date): UrgencyLevel {
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  const hours = (now - created) / (1000 * 60 * 60);

  if (hours > 24) return 'critical';
  if (hours > 12) return 'warning';
  return 'normal';
}

const URGENCY_STYLES: Record<UrgencyLevel, { dot: string; label: string }> = {
  normal: { dot: 'bg-gray-400', label: 'Normal' },
  warning: { dot: 'bg-yellow-500', label: 'Needs review soon' },
  critical: { dot: 'bg-red-500', label: 'Urgent review' },
};

export default function PaymentUrgencyIndicator(
  props: PaymentUrgencyIndicatorProps
): React.JSX.Element {
  const { createdAt, status = 'pending', showLabel = false, className = '' } = props;

  if (status !== 'pending') {
    return (
      <span className={['inline-flex items-center gap-2', className].join(' ')}>
        <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
        {showLabel ? <span className="text-xs text-gray-500">Not pending</span> : null}
      </span>
    );
  }

  const urgency = getUrgency(createdAt);
  const style = URGENCY_STYLES[urgency];

  return (
    <span className={['inline-flex items-center gap-2', className].join(' ')}>
      <span className={['h-2.5 w-2.5 rounded-full', style.dot].join(' ')} />
      {showLabel ? <span className="text-xs text-gray-600 dark:text-gray-300">{style.label}</span> : null}
    </span>
  );
}
