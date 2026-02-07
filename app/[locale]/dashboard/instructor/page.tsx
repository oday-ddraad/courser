'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/auth/permissions';
import { useTranslations } from 'next-intl';

export default function InstructorDashboard() {
  const { data: session, status } = useSession();
  const t = useTranslations('Dashboard.instructor');

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
          <p className="text-3xl font-bold text-blue-600">12</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">{t('totalStudents')}</h3>
          <p className="text-3xl font-bold text-green-600">456</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">{t('pendingReviews')}</h3>
          <p className="text-3xl font-bold text-yellow-600">8</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">{t('revenue')}</h3>
          <p className="text-3xl font-bold text-purple-600">$3,456</p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">{t('quickActions')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="/dashboard/instructor/courses/new" className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition">
            {t('createCourse')}
          </a>
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
