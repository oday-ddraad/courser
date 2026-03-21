'use client';

interface AdminPaymentStatsProps {
  totalRevenue: number;
  pendingCount: number;
  approvedCount: number;
  todayRevenue: number;
  currency?: string;
  className?: string;
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

export default function AdminPaymentStats({
  totalRevenue,
  pendingCount,
  approvedCount,
  todayRevenue,
  currency = 'USD',
  className = '',
}: AdminPaymentStatsProps) {
  return (
    <div className={['grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4', className].join(' ')}>
      <StatCard label="Total Revenue" value={`${totalRevenue} ${currency}`} />
      <StatCard label="Pending Review" value={pendingCount} />
      <StatCard label="Approved" value={approvedCount} />
      <StatCard label="Today Revenue" value={`${todayRevenue} ${currency}`} />
    </div>
  );
}
