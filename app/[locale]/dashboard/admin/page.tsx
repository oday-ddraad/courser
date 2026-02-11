'use client';

import { useTranslations, useLocale } from 'next-intl';

export default function AdminDashboard() {
  const t = useTranslations('Dashboard.admin');
  const locale = useLocale();


  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Admin-specific widgets */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">{t('totalUsers')}</h3>
          <p className="text-3xl font-bold text-blue-600">1,234</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">{t('activeCourses')}</h3>
          <p className="text-3xl font-bold text-green-600">56</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">{t('pendingPayments')}</h3>
          <p className="text-3xl font-bold text-yellow-600">23</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">{t('revenue')}</h3>
          <p className="text-3xl font-bold text-purple-600">$12,345</p>
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
        </div>
      </div>

    </div>
  );
}
