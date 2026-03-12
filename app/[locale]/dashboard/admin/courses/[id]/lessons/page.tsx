'use client';

import { useSession } from 'next-auth/react';
import { redirect, useParams } from 'next/navigation';
import { hasPermission } from '@/lib/auth/permissions';
import { useLocale } from 'next-intl';
import { useState, useEffect } from 'react';
import LessonManagement from '@/components/courses/LessonManagement';
import { Loader2, X, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminLessonsPage() {
  const { data: session, status } = useSession();
  const locale = useLocale();
  const params = useParams();
  const courseId = params.id as string;

  const [courseSlug, setCourseSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== 'loading' && session) {
      fetchCourseSlug();
    }
  }, [courseId, status, session]);

  const fetchCourseSlug = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch the course to get the slug
      const response = await fetch(`/api/courses/${courseId}`);
      const data = await response.json();
      
      console.log('Admin course fetch response:', data);
      
      if (!response.ok) {
        setError(data.error || 'Failed to fetch course');
        setLoading(false);
        return;
      }
      
      if (data.success && data.data) {
        setCourseSlug(data.data.slug);
      } else {
        setError('Course not found');
      }
    } catch (err) {
      console.error('Error fetching course:', err);
      setError('Error loading course');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!session || !hasPermission(session.user.role, 'course.manage')) {
    redirect('/forbidden');
  }

  if (error || !courseSlug) {
    return (
      <div className="p-6">
        <div className="text-center max-w-md mx-auto">
          <X className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {error || 'Course not found'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Unable to load the course. Please check the URL or go back to courses.
          </p>
          <Link 
            href={`/${locale}/dashboard/admin/courses`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  // Admin has full permissions
  const canEdit = true;
  const canDelete = true;
  const canPublish = true;

  return (
    <LessonManagement
      courseId={courseId}
      courseSlug={courseSlug}
      userRole="admin"
      backLink={`/${locale}/dashboard/admin/courses`}
      canEdit={canEdit}
      canDelete={canDelete}
      canPublish={canPublish}
    />
  );
}
