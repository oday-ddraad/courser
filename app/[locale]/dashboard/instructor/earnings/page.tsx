'use client';

import { useEffect, useMemo, useState } from 'react';
import InstructorEarningsCard from '@/components/payments/InstructorEarningsCard';

interface InstructorStats {
  approvedPaymentsCount: number;
  refundedPaymentsCount: number;
  grossRevenue: number;
  refundedAmount: number;
  netRevenue: number;
  totalEnrollments: number;
  activeEnrollments: number;
  pendingEnrollments: number;
  cancelledEnrollments: number;
}

export default function InstructorEarningsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<InstructorStats | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/instructor/payment-stats', { cache: 'no-store' });
      const json = await res.json();
      if (res.ok && json?.success) {
        setStats(json.data || null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, []);

  const cards = useMemo(
    () => [
      { title: 'Net Revenue', value: stats?.netRevenue ?? 0 },
      { title: 'Gross Revenue', value: stats?.grossRevenue ?? 0 },
      { title: 'Refunded Amount', value: stats?.refundedAmount ?? 0 },
      { title: 'Approved Payments', value: stats?.approvedPaymentsCount ?? 0 },
      { title: 'Refunded Payments', value: stats?.refundedPaymentsCount ?? 0 },
      { title: 'Total Enrollments', value: stats?.totalEnrollments ?? 0 },
      { title: 'Active Enrollments', value: stats?.activeEnrollments ?? 0 },
      { title: 'Pending Enrollments', value: stats?.pendingEnrollments ?? 0 },
      { title: 'Cancelled Enrollments', value: stats?.cancelledEnrollments ?? 0 },
    ],
    [stats]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Instructor Earnings</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Track your earnings, refunds, and enrollment stats in near real-time.
        </p>
      </div>

      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-5 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
          Loading earnings...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <InstructorEarningsCard
              key={card.title}
              title={card.title}
              value={card.value}
            />
          ))}
        </div>
      )}
    </div>
  );
}
