'use client';

interface InstructorEarningsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  className?: string;
}

export default function InstructorEarningsCard({
  title,
  value,
  subtitle,
  className = '',
}: InstructorEarningsCardProps) {
  return (
    <div className={['rounded-xl border border-gray-200 p-4 dark:border-gray-700', className].join(' ')}>
      <p className="text-xs text-gray-500">{title}</p>
      <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">{value}</p>
      {subtitle ? <p className="mt-1 text-xs text-gray-500">{subtitle}</p> : null}
    </div>
  );
}
