'use client';

import { useState } from 'react';

import { useTranslations, useLocale } from 'next-intl';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';


export default function AdminDashboard() {
  const t = useTranslations('Dashboard.admin');
  const locale = useLocale();
  const [stats, setStats] = useState({
    totalUsers: 1234,
    activeCourses: 56,
    pendingPayments: 0,
    revenue: 0,
  });

  const loadStats = async () => {
    try {
      const [paymentStatsRes, usersRes, coursesRes] = await Promise.all([
        fetch('/api/admin/payment-stats', { cache: 'no-store' }),
        fetch('/api/users?limit=1', { cache: 'no-store' }),
        fetch('/api/courses?limit=1', { cache: 'no-store' }),
      ]);

      const paymentStatsJson = await paymentStatsRes.json();
      const usersJson = usersRes.ok ? await usersRes.json() : null;
      const coursesJson = coursesRes.ok ? await coursesRes.json() : null;

      setStats((prev) => ({
        ...prev,
        pendingPayments: paymentStatsJson?.data?.pendingPayments ?? 0,
        revenue: paymentStatsJson?.data?.totalRevenue ?? 0,
        totalUsers: usersJson?.pagination?.total ?? prev.totalUsers,
        activeCourses: coursesJson?.pagination?.total ?? prev.activeCourses,
      }));
    } catch (error) {
      console.error('Failed to load admin dashboard stats:', error);
    }
  };

  useAutoRefresh(loadStats, 10000);

  return (

    <div>
      <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Admin-specific widgets */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">{t('totalUsers')}</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totalUsers}</p>

        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">{t('activeCourses')}</h3>
          <p className="text-3xl font-bold text-green-600">{stats.activeCourses}</p>

        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">{t('pendingPayments')}</h3>
          <p className="text-3xl font-bold text-yellow-600">{stats.pendingPayments}</p>

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <a href={`/${locale}/dashboard/admin/users`} className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition text-center">
            {t('manageUsers')}
          </a>
          <a href={`/${locale}/dashboard/admin/courses`} className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition text-center">
            {t('manageCourses')}
          </a>
          <a href={`/${locale}/dashboard/admin/categories`} className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 transition text-center">
            {t('manageCategories')}
          </a>
          <a href={`/${locale}/dashboard/admin/instructors`} className="bg-indigo-600 text-white p-4 rounded-lg hover:bg-indigo-700 transition text-center">
            {t('manageInstructors')}
          </a>
          <a href={`/${locale}/dashboard/admin/messages`} className="bg-pink-600 text-white p-4 rounded-lg hover:bg-pink-700 transition text-center">
            {t('sendMessages')}
          </a>
          <a href={`/${locale}/dashboard/admin/payments`} className="bg-yellow-600 text-white p-4 rounded-lg hover:bg-yellow-700 transition text-center">
            {t('reviewPayments')}
          </a>
          <a href={`/${locale}/dashboard/admin/payments/methods`} className="bg-amber-600 text-white p-4 rounded-lg hover:bg-amber-700 transition text-center">
            Payment Methods
          </a>
          <a href={`/${locale}/dashboard/test-pusher`} className="bg-teal-600 text-white p-4 rounded-lg hover:bg-teal-700 transition text-center">
            {t('testPusherNotifications')}
          </a>


        </div>
      </div>

    </div>
  );
}
