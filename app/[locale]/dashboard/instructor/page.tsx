'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/auth/permissions';
import { useLocale, useTranslations } from 'next-intl';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { useState } from 'react';


export default function InstructorDashboard() {
  const { data: session, status } = useSession();
  const t = useTranslations('Dashboard.instructor');
  const locale = useLocale();
  const [stats, setStats] = useState({
    myCourses: 12,
    totalStudents: 456,
    pendingReviews: 0,
    revenue: 0,
  });

  const loadStats = async () => {
    try {
      const [paymentStatsRes, coursesRes] = await Promise.all([
        fetch('/api/instructor/payment-stats', { cache: 'no-store' }),
        fetch('/api/courses?instructor=me&limit=1', { cache: 'no-store' }),
      ]);

      const paymentStatsJson = await paymentStatsRes.json();
      const coursesJson = coursesRes.ok ? await coursesRes.json() : null;

      setStats((prev) => ({
        ...prev,
        myCourses: coursesJson?.pagination?.total ?? prev.myCourses,
        totalStudents: paymentStatsJson?.data?.totalEnrollments ?? prev.totalStudents,
        pendingReviews: paymentStatsJson?.data?.pendingEnrollments ?? 0,
        revenue: paymentStatsJson?.data?.netRevenue ?? 0,
      }));
    } catch (error) {
      console.error('Failed to load instructor dashboard stats:', error);
    }
  };

  useAutoRefresh(loadStats, 10000);


  if (status === 'loading') {
    return <div className="p-6">Loading...</div>;
  }

  if (!session || !hasPermission(session.user.role, 'course.create')) {
    redirect('/forbidden');
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Instructor-specific widgets */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">{t('myCourses')}</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.myCourses}</p>

        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">{t('totalStudents')}</h3>
          <p className="text-3xl font-bold text-green-600">{stats.totalStudents}</p>

        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">{t('pendingReviews')}</h3>
          <p className="text-3xl font-bold text-yellow-600">{stats.pendingReviews}</p>

        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">{t('revenue')}</h3>
          <p className="text-3xl font-bold text-purple-600">
            {new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(stats.revenue)}
          </p>

        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">{t('quickActions')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a href="/dashboard/instructor/courses" className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition">
            {t('manageCourses')}
          </a>
          <a href="/dashboard/instructor/students" className="bg-yellow-600 text-white p-4 rounded-lg hover:bg-yellow-700 transition">
            {t('viewStudents')}
          </a>
        </div>
      </div>
    </div>
  );
}
