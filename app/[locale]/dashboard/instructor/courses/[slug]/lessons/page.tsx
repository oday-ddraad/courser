'use client';

import { useSession } from 'next-auth/react';
import { redirect, useParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useState, useEffect } from 'react';
import LessonManagement from '@/components/courses/LessonManagement';
import { Loader2, X, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function InstructorLessonsPage() {
  const { data: session, status } = useSession();
  const locale = useLocale();
  const params = useParams();
  const slug = params.slug as string;

  const [courseId, setCourseId] = useState<string | null>(null);
  const [courseApprovalStatus, setCourseApprovalStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== 'loading' && session) {
      fetchCourseBySlug();
    }
  }, [slug, status, session]);

  const fetchCourseBySlug = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First try to fetch the course by slug
      const response = await fetch(`/api/courses?slug=${slug}&myCourses=true`);
      const data = await response.json();
      
      console.log('Course fetch response:', data);
      
      if (!response.ok) {
        setError(data.error || 'Failed to fetch course');
        setLoading(false);
        return;
      }
      
      if (data.success && data.data && data.data.length > 0) {
        const course = data.data[0];
        console.log('Found course:', course);
        console.log('Session user ID:', session?.user?.id);
        console.log('Instructor IDs:', course.instructorIds);
        
        // Check if instructor owns this course
        // instructorIds might be populated objects or string IDs
        const isOwner = course.instructorIds?.some((inst: any) => {
          let instId: string;
          if (typeof inst === 'string') {
            instId = inst;
          } else if (inst._id) {
            // Handle populated object - _id might be string or ObjectId
            instId = typeof inst._id === 'string' ? inst._id : inst._id.toString();
          } else if (inst.toString) {
            // Handle ObjectId directly
            instId = inst.toString();
          } else {
            instId = String(inst);
          }
          const matches = instId === session?.user?.id;
          console.log(`Checking instructor ${instId} against user ${session?.user?.id}: ${matches}`);
          return matches;
        });
        
        console.log('Is owner:', isOwner);
        
        if (isOwner || session?.user?.role === 'admin') {
          setCourseId(course._id);
          setCourseApprovalStatus(course.approvalStatus || 'pending');
        } else {
          // Not owner, redirect
          console.log('Not owner, redirecting');
          redirect(`/${locale}/dashboard/instructor/courses`);
        }
      } else {
        // Course not found
        console.log('Course not found, data:', data);
        setError('Course not found or you do not have access');
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

  if (!session || session.user.role !== 'instructor') {
    redirect('/forbidden');
  }

  if (error || !courseId) {
    return (
      <div className="p-6">
        <div className="text-center max-w-md mx-auto">
          <X className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {error || 'Course not found'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Unable to load the course "{slug}". Please check the URL or go back to your courses.
          </p>
          <Link 
            href={`/${locale}/dashboard/instructor/courses`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to My Courses
          </Link>
        </div>
      </div>
    );
  }

  // Determine permissions based on course approval status
  // Instructors can only edit if course is pending or rejected
  // Once approved, only admin can edit/publish/delete
  const canEdit = courseApprovalStatus === 'pending' || courseApprovalStatus === 'rejected';
  const canDelete = false; // Instructors cannot delete lessons (admin only)
  const canPublish = false; // Instructors cannot publish directly (admin approval required)

  return (
    <LessonManagement
      courseId={courseId}
      courseSlug={slug}
      userRole="instructor"
      userId={session.user.id}
      backLink={`/${locale}/dashboard/instructor/courses`}
      canEdit={canEdit}
      canDelete={canDelete}
      canPublish={canPublish}
    />
  );
}

