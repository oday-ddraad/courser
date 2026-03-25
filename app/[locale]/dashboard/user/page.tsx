'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/auth/permissions';
import { useLocale, useTranslations } from 'next-intl';
import LiveSessionNotification from '@/components/LiveSessionNotification';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { useState } from 'react';



export default function UserDashboard() {
  const { data: session, status } = useSession();
  const t = useTranslations('Dashboard.user');
  const locale = useLocale();
  const [stats, setStats] = useState({
    enrolledCourses: 0,
    completedCourses: 0,
    pendingPayments: 0,
    totalSpent: 0,
  });

  const loadStats = async () => {
    try {
      const res = await fetch('/api/user/payment-stats', { cache: 'no-store' });
      const json = await res.json();

      if (!res.ok || !json?.success) {
        return;
      }

      setStats({
        enrolledCourses: json?.data?.totalEnrollments ?? 0,
        completedCourses: json?.data?.completedEnrollments ?? 0,
        pendingPayments: json?.data?.pendingPayments ?? 0,
        totalSpent: json?.data?.totalPaidAmount ?? 0,
      });
    } catch (error) {
      console.error('Failed to load user dashboard stats:', error);
    }
  };

  useAutoRefresh(loadStats, 10000);


  if (status === 'loading') {
    return <div className="p-6">Loading...</div>;
  }

  if (!session || !hasPermission(session.user.role, 'profile.update')) {
    redirect('/forbidden');
  }

  return (
    <div className="p-6">
      {/* Live Session Notification - shows when instructor starts a meeting */}
      <LiveSessionNotification />
      
      <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* User-specific widgets */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">{t('enrolledCourses')}</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.enrolledCourses}</p>

        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">{t('completedCourses')}</h3>
          <p className="text-3xl font-bold text-green-600">{stats.completedCourses}</p>

        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">{t('pendingPayments')}</h3>
          <p className="text-3xl font-bold text-yellow-600">{stats.pendingPayments}</p>

        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">{t('totalSpent')}</h3>
          <p className="text-3xl font-bold text-purple-600">
            {new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(stats.totalSpent)}
          </p>

        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">{t('quickActions')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="/courses" className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition">
            {t('browseCourses')}
          </a>
          <a href="/dashboard/user/courses" className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition">
            {t('myCourses')}
          </a>
          <a href="/dashboard/user/payments" className="bg-yellow-600 text-white p-4 rounded-lg hover:bg-yellow-700 transition">
            {t('paymentHistory')}
          </a>
        </div>
      </div>
    </div>
  );
}
