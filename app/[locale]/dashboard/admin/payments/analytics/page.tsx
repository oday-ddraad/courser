'use client';

import { useEffect, useMemo, useState } from 'react';
import RevenueAnalyticsChart from '@/components/payments/RevenueAnalyticsChart';

interface MonthlyRevenue {
  month: string;
  revenue: number;
  count?: number;
}

interface ByMethod {
  method: string;
  revenue: number;
  percentage?: number;
}

interface ByCountry {
  country: string;
  revenue: number;
  count?: number;
}

interface ByCourse {
  courseTitle: string;
  revenue: number;
  students?: number;
}

interface AnalyticsResponse {
  monthlyRevenue?: MonthlyRevenue[];
  revenueByMethod?: ByMethod[];
  revenueByCountry?: ByCountry[];
  revenueByCourse?: ByCourse[];
}

export default function AdminPaymentsAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsResponse>({});

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/payment-analytics', { cache: 'no-store' });
      const json = await res.json();
      if (res.ok && json?.success) {
        setData(json.data || {});
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const monthlyChart = useMemo(
    () =>
      (data.monthlyRevenue || []).map((item) => ({
        label: item.month,
        value: Number(item.revenue || 0),
      })),
    [data.monthlyRevenue]
  );

  const byMethodChart = useMemo(
    () =>
      (data.revenueByMethod || []).map((item) => ({
        label: item.method,
        value: Number(item.revenue || 0),
      })),
    [data.revenueByMethod]
  );

  const byCountryChart = useMemo(
    () =>
      (data.revenueByCountry || []).map((item) => ({
        label: item.country,
        value: Number(item.revenue || 0),
      })),
    [data.revenueByCountry]
  );

  const byCourseChart = useMemo(
    () =>
      (data.revenueByCourse || []).map((item) => ({
        label: item.courseTitle,
        value: Number(item.revenue || 0),
      })),
    [data.revenueByCourse]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Revenue Analytics</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Revenue trends by month, method, country, and course.
          </p>
        </div>
        <button
          onClick={() => window.open('/api/payments/export?format=csv', '_blank')}
          className="rounded-md bg-gray-900 px-3 py-2 text-sm text-white hover:bg-black dark:bg-gray-100 dark:text-gray-900"
        >
          Export CSV
        </button>
      </div>

      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-5 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
          Loading analytics...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <RevenueAnalyticsChart title="Monthly Revenue" data={monthlyChart} />
          <RevenueAnalyticsChart title="Revenue by Payment Method" data={byMethodChart} />
          <RevenueAnalyticsChart title="Revenue by Country" data={byCountryChart} />
          <RevenueAnalyticsChart title="Revenue by Course" data={byCourseChart} />
        </div>
      )}
    </div>
  );
}
