'use client';

interface PaymentLimitWarningProps {
  maxPending: number;
  currentPending: number;
  className?: string;
}

export default function PaymentLimitWarning({
  maxPending,
  currentPending,
  className = '',
}: PaymentLimitWarningProps) {
  const reached = currentPending >= maxPending;

  if (!reached) return null;

  return (
    <div
      className={[
        'rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200',
        className,
      ].join(' ')}
    >
      You have reached the maximum pending payment limit ({currentPending}/{maxPending}).
      Please complete, cancel, or resolve existing pending payments before creating a new one.
    </div>
  );
}
