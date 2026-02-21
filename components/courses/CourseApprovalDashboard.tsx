'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';

interface Course {
  _id: string;
  slug: string;
  title: {
    en: string;
    de: string;
    ar: string;
  };
  description: {
    en: string;
    de: string;
    ar: string;
  };
  category: string;
  level: string;
  courseType: 'live' | 'uploaded';
  instructorId: {
    _id: string;
    name: string;
    email: string;
  };
  approvalStatus: 'pending' | 'approved' | 'rejected';
  submittedForApprovalAt: string;
  lessons: {
    _id: string;
    order: number;
    title: {
      en: string;
      de: string;
      ar: string;
    };
    youtubeVideoId?: string;
    isPublished: boolean;
  }[];
  createdAt: string;
}

interface CourseApprovalDashboardProps {
  locale: string;
}

export default function CourseApprovalDashboard({ locale }: CourseApprovalDashboardProps) {
  const router = useRouter();
  const t = useTranslations('courses');
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    fetchPendingCourses();
  }, [filter]);

  const fetchPendingCourses = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/courses/approval?status=${filter}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch courses');
      }

      setCourses(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (courseId: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/courses/approval', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId,
          action: 'approve',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve course');
      }

      // Refresh the list
      fetchPendingCourses();
      setSelectedCourse(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (courseId: string) => {
    if (!rejectionReason.trim()) {
      setError('Please provide a rejection reason');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/courses/approval', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId,
          action: 'reject',
          rejectionReason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject course');
      }

      // Refresh the list
      fetchPendingCourses();
      setSelectedCourse(null);
      setRejectionReason('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    };

    const labels = {
      pending: locale === 'ar' ? 'معلق' : 'Pending',
      approved: locale === 'ar' ? 'تمت الموافقة' : 'Approved',
      rejected: locale === 'ar' ? 'مرفوض' : 'Rejected',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {locale === 'ar' ? 'لوحة موافقة الدورات' : 'Course Approval Dashboard'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {locale === 'ar' ? 'مراجعة وموافقة الدورات المقدمة من المدرسين' : 'Review and approve courses submitted by instructors'}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300">
          {error}
          <button 
            onClick={() => setError('')}
            className="ml-2 text-sm underline"
          >
            {locale === 'ar' ? 'إغلاق' : 'Dismiss'}
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        {[
          { key: 'pending', label: locale === 'ar' ? 'معلق' : 'Pending', labelAr: 'معلق' },
          { key: 'approved', label: locale === 'ar' ? 'تمت الموافقة' : 'Approved', labelAr: 'تمت الموافقة' },
          { key: 'rejected', label: locale === 'ar' ? 'مرفوض' : 'Rejected', labelAr: 'مرفوض' },
          { key: 'all', label: locale === 'ar' ? 'الكل' : 'All', labelAr: 'الكل' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`
              px-4 py-2 font-medium transition-colors
              ${filter === tab.key
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }
            `}
          >
            {locale === 'ar' ? tab.labelAr : tab.label}
          </button>
        ))}
      </div>

      {/* Courses List */}
      {courses.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400">
            {locale === 'ar' ? 'لا توجد دورات في هذه الفئة' : 'No courses in this category'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {courses.map((course) => (
            <div key={course._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {course.title.en}
                      </h3>
                      {getStatusBadge(course.approvalStatus)}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                      {locale === 'ar' ? 'المدرس: ' : 'Instructor: '}
                      <span className="font-medium">{course.instructorId.name}</span> ({course.instructorId.email})
                    </p>
                    <p className="text-gray-500 dark:text-gray-500 text-sm">
                      {locale === 'ar' ? 'تاريخ التقديم: ' : 'Submitted: '}
                      {formatDate(course.submittedForApprovalAt || course.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedCourse(selectedCourse?._id === course._id ? null : course)}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      {selectedCourse?._id === course._id 
                        ? (locale === 'ar' ? 'إخفاء التفاصيل' : 'Hide Details')
                        : (locale === 'ar' ? 'عرض التفاصيل' : 'View Details')
                      }
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                      {locale === 'ar' ? 'الفئة' : 'Category'}
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">{course.category}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                      {locale === 'ar' ? 'المستوى' : 'Level'}
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white capitalize">{course.level}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                      {locale === 'ar' ? 'النوع' : 'Type'}
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {course.courseType === 'live' 
                        ? (locale === 'ar' ? 'مباشر' : 'Live')
                        : (locale === 'ar' ? 'مسجل' : 'Recorded')
                      }
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                      {locale === 'ar' ? 'الدروس' : 'Lessons'}
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">{course.lessons.length}</p>
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedCourse?._id === course._id && (
                  <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                      {locale === 'ar' ? 'تفاصيل الدورة' : 'Course Details'}
                    </h4>
                    
                    {/* Description */}
                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {locale === 'ar' ? 'الوصف' : 'Description'}
                      </h5>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">{course.description.en}</p>
                      {course.description.ar && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm mt-2 dir-rtl">{course.description.ar}</p>
                      )}
                    </div>

                    {/* Lessons Preview */}
                    <div className="mb-6">
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {locale === 'ar' ? 'الدروس' : 'Lessons'}
                      </h5>
                      <div className="space-y-2">
                        {course.lessons.map((lesson, index) => (
                          <div key={lesson._id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <span className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </span>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 dark:text-white text-sm">{lesson.title.en}</p>
                              {lesson.youtubeVideoId && (
                                <p className="text-xs text-green-600 dark:text-green-400">
                                  ✓ {locale === 'ar' ? 'فيديو مرفق' : 'Video attached'}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {course.approvalStatus === 'pending' && (
                      <div className="flex gap-4">
                        <button
                          onClick={() => handleApprove(course._id)}
                          disabled={isProcessing}
                          className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                          {isProcessing 
                            ? (locale === 'ar' ? 'جاري المعالجة...' : 'Processing...')
                            : (locale === 'ar' ? 'الموافقة على الدورة' : 'Approve Course')
                          }
                        </button>
                        
                        <div className="flex-1">
                          <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder={locale === 'ar' ? 'سبب الرفض (مطلوب)' : 'Rejection reason (required)'}
                            className="w-full px-4 py-2 border border-red-300 dark:border-red-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm mb-2"
                            rows={2}
                          />
                          <button
                            onClick={() => handleReject(course._id)}
                            disabled={isProcessing || !rejectionReason.trim()}
                            className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                          >
                            {isProcessing 
                              ? (locale === 'ar' ? 'جاري المعالجة...' : 'Processing...')
                              : (locale === 'ar' ? 'رفض الدورة' : 'Reject Course')
                            }
                          </button>
                        </div>
                      </div>
                    )}

                    {course.approvalStatus === 'rejected' && (
                      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <h5 className="font-medium text-red-900 dark:text-red-300 mb-1">
                          {locale === 'ar' ? 'سبب الرفض:' : 'Rejection Reason:'}
                        </h5>
                        <p className="text-red-800 dark:text-red-400 text-sm">
                          {course.rejectionReason || (locale === 'ar' ? 'غير محدد' : 'Not specified')}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
