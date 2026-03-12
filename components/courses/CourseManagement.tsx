'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/auth/permissions';
import { useTranslations, useLocale } from 'next-intl';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users, 
  BookOpen, 
  MoreVertical,
  Filter,
  ChevronLeft,
  ChevronRight,
  Send,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import CourseStatsCard from './CourseStatsCard';

interface Course {
  _id: string;
  slug: string;
  title: {
    en: string;
    de: string;
    ar: string;
  };
  instructorId?: {
    _id: string;
    name: string;
    email: string;
  };
  instructorIds?: Array<{
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  }>;
  level: string;
  category: string;
  price: number;
  isPublished: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  enrollmentCount: number;
  groups: Array<{
    _id: string;
    name: string;
    students: string[];
  }>;
  createdAt: string;
  rejectionReason?: string;
}

interface CourseManagementProps {
  role: 'admin' | 'instructor';
}

export default function CourseManagement({ role }: CourseManagementProps) {
  const { data: session, status } = useSession();
  const t = useTranslations(role === 'admin' ? 'Dashboard.admin.courses' : 'Dashboard.instructor.courses');
  const locale = useLocale();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterApprovalStatus, setFilterApprovalStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState<Array<{ _id: string; name: { en: string; de: string; ar: string }; slug: string }>>([]);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [submittingApproval, setSubmittingApproval] = useState<string | null>(null);

  const isAdmin = role === 'admin';
  const isInstructor = role === 'instructor';

  useEffect(() => {
    if (status !== 'loading' && session) {
      if (isAdmin && !hasPermission(session.user.role, 'course.manage')) {
        redirect('/forbidden');
      }
      if (isInstructor && session.user.role !== 'instructor') {
        redirect('/forbidden');
      }
      fetchCourses();
      fetchCategories();
    }
  }, [currentPage, searchQuery, filterLevel, filterCategory, filterStatus, status, session]);

  if (status === 'loading') {
    return <div className="p-6">Loading...</div>;
  }

  if (!session) {
    redirect('/forbidden');
  }

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchQuery && { search: searchQuery }),
        ...(filterLevel && { level: filterLevel }),
        ...(filterCategory && { category: filterCategory }),
        ...(filterStatus && { status: filterStatus }),
        ...(isInstructor && { myCourses: 'true' }),
      });

      const response = await fetch(`/api/courses?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setCourses(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/courses/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;

    try {
      const response = await fetch(`/api/courses/${courseToDelete._id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCourses(courses.filter(c => c._id !== courseToDelete._id));
        setDeleteModalOpen(false);
        setCourseToDelete(null);
      } else {
        alert('Failed to delete course');
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Error deleting course');
    }
  };

  const handleSubmitForApproval = async (courseId: string) => {
    setSubmittingApproval(courseId);
    try {
      const response = await fetch(`/api/courses/${courseId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        fetchCourses();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to submit for approval');
      }
    } catch (error) {
      console.error('Error submitting for approval:', error);
      alert('Error submitting for approval');
    } finally {
      setSubmittingApproval(null);
    }
  };

  const getLocalizedTitle = (title: Course['title']) => {
    return title[locale as keyof typeof title] || title.en;
  };

  const getStatusBadge = (course: Course) => {
    if (isInstructor) {
      // For instructors, show approval status
      const statusConfig = {
        pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: Clock, label: t('pendingApproval') || 'Pending Approval' },
        approved: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: CheckCircle, label: t('approved') || 'Approved' },
        rejected: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: XCircle, label: t('rejected') || 'Rejected' },
      };
      const config = statusConfig[course.approvalStatus];
      const Icon = config.icon;
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${config.color}`}>
          <Icon className="w-3 h-3" />
          {config.label}
        </span>
      );
    } else {
      // For admin, show publish status
      return (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          course.isPublished 
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
        }`}>
          {course.isPublished ? t('published') : t('draft')}
        </span>
      );
    }
  };

  const getEditLink = (course: Course) => {
    if (isAdmin) {
      return `/${locale}/dashboard/admin/courses/${course._id}/edit`;
    }
    return `/${locale}/dashboard/instructor/courses/${course.slug}/edit`;
  };

  const getLessonsLink = (course: Course) => {
    if (isAdmin) {
      return `/${locale}/dashboard/admin/courses/${course._id}/lessons`;
    }
    return `/${locale}/dashboard/instructor/courses/${course.slug}/lessons`;
  };

  const getGroupsLink = (course: Course) => {
    if (isAdmin) {
      return `/${locale}/dashboard/admin/courses/${course._id}/groups`;
    }
    return `/${locale}/dashboard/instructor/courses/${course.slug}/groups`;
  };

  const getStudentsLink = (course: Course) => {
    if (isAdmin) {
      return `/${locale}/dashboard/admin/courses/${course._id}/students`;
    }
    return `/${locale}/dashboard/instructor/courses/${course.slug}/students`;
  };

  const getCreateLink = () => {
    if (isAdmin) {
      return `/${locale}/dashboard/admin/courses/new`;
    }
    return `/${locale}/dashboard/instructor/courses/create`;
  };

  const canEdit = (course: Course) => {
    if (isAdmin) return true;
    // Instructors can only edit if course is pending or rejected
    return course.approvalStatus === 'pending' || course.approvalStatus === 'rejected';
  };

  const canDelete = (course: Course) => {
    // Only admin can delete
    if (!isAdmin) return false;
    // Only delete if no enrollments
    return (course.enrollmentCount || 0) === 0;
  };

  const canSubmitForApproval = (course: Course) => {
    if (!isInstructor) return false;
    return course.approvalStatus === 'pending' || course.approvalStatus === 'rejected';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {isInstructor 
              ? (locale === 'ar' ? 'إدارة دوراتك ودروسك' : locale === 'de' ? 'Verwalten Sie Ihre Kurse und Lektionen' : 'Manage your courses and lessons')
              : t('subtitle', { count: courses.length })
            }
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-3">
          {isAdmin && (
            <Link
              href={`/${locale}/dashboard/admin/categories`}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              <Filter className="w-4 h-4 mr-2" />
              {t('manageCategories')}
            </Link>
          )}
          <Link
            href={getCreateLink()}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('createCourse')}
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={t('searchPlaceholder') || 'Search courses...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
            />
          </div>
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          >
            <option value="">{t('allLevels') || 'All Levels'}</option>
            <option value="beginner">{t('beginner') || 'Beginner'}</option>
            <option value="intermediate">{t('intermediate') || 'Intermediate'}</option>
            <option value="advanced">{t('advanced') || 'Advanced'}</option>
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          >
            <option value="">{t('allCategories') || 'All Categories'}</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat.slug}>
                {cat.name[locale as keyof typeof cat.name] || cat.name.en}
              </option>
            ))}
          </select>

          {isAdmin ? (
            <select
              value={filterApprovalStatus}
              onChange={(e) => setFilterApprovalStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
            >
              <option value="">{t('allApprovalStatuses') || 'All Approval Statuses'}</option>
              <option value="pending">{t('pendingApproval') || 'Pending Approval'}</option>
              <option value="approved">{t('approved') || 'Approved'}</option>
              <option value="rejected">{t('rejected') || 'Rejected'}</option>
            </select>
          ) : (
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
            >
              <option value="">{t('allStatuses') || 'All Statuses'}</option>
              <option value="pending">{t('pending') || 'Pending'}</option>
              <option value="approved">{t('approved') || 'Approved'}</option>
              <option value="rejected">{t('rejected') || 'Rejected'}</option>
            </select>
          )}
        </div>
      </div>

      {/* Courses Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">{t('loading') || 'Loading...'}</p>
          </div>
        ) : !courses || courses.length === 0 ? (
          <div className="p-8 text-center">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">{t('noCourses') || 'No courses found'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('course') || 'Course'}
                  </th>
                  {isAdmin && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('instructor') || 'Instructor'}
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('level') || 'Level'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('students') || 'Students'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('groups') || 'Groups'}
                  </th>
                  {isAdmin && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('approvalStatus') || 'Approval'}
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('status') || 'Status'}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('actions') || 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {courses.map((course) => (
                  <tr key={course._id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {getLocalizedTitle(course.title)}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {course.category}
                          </div>
                          {isInstructor && course.rejectionReason && (
                            <div className="text-xs text-red-500 mt-1">
                              {locale === 'ar' ? 'السبب: ' : 'Reason: '}{course.rejectionReason}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {course.instructorIds && course.instructorIds.length > 0 
                            ? course.instructorIds.map(inst => inst.name).join(', ')
                            : (t('noInstructor') || 'No Instructor')
                          }
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {course.instructorIds && course.instructorIds.length > 0 
                            ? course.instructorIds[0].email 
                            : ''
                          }
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        course.level === 'beginner' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        course.level === 'intermediate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {t(course.level) || course.level}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-900 dark:text-white">
                        <Users className="w-4 h-4 mr-1 text-gray-400" />
                        {course.enrollmentCount || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {course.groups?.length || 0} {t('groups') || 'groups'}
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${
                          course.approvalStatus === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          course.approvalStatus === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {course.approvalStatus === 'pending' && <Clock className="w-3 h-3" />}
                          {course.approvalStatus === 'approved' && <CheckCircle className="w-3 h-3" />}
                          {course.approvalStatus === 'rejected' && <XCircle className="w-3 h-3" />}
                          {course.approvalStatus === 'pending' ? (t('pendingApproval') || 'Pending') :
                           course.approvalStatus === 'approved' ? (t('approved') || 'Approved') :
                           (t('rejected') || 'Rejected')}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      {getStatusBadge(course)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Edit Button */}
                        <Link
                          href={getEditLink(course)}
                          className={`${canEdit(course) ? 'text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300' : 'text-gray-400 cursor-not-allowed'}`}
                          title={canEdit(course) ? (t('edit') || 'Edit') : (locale === 'ar' ? 'لا يمكن التعديل بعد الموافقة' : 'Cannot edit after approval')}
                          onClick={(e) => !canEdit(course) && e.preventDefault()}
                        >
                          <Edit className="w-5 h-5" />
                        </Link>

                        {/* Lessons Button */}
                        <Link
                          href={getLessonsLink(course)}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          title={t('manageLessons') || 'Manage Lessons'}
                        >
                          <BookOpen className="w-5 h-5" />
                        </Link>

                        {/* Students Button */}
                        <Link
                          href={getStudentsLink(course)}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          title={t('manageStudents') || 'Manage Students'}
                        >
                          <Users className="w-5 h-5" />
                        </Link>

                        {/* Groups Button */}
                        <Link
                          href={getGroupsLink(course)}
                          className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                          title={t('manageGroups') || 'Manage Groups'}
                        >
                          <MoreVertical className="w-5 h-5" />
                        </Link>

                        {/* Submit for Approval Button (Instructor only) */}
                        {canSubmitForApproval(course) && (
                          <button
                            onClick={() => handleSubmitForApproval(course._id)}
                            disabled={submittingApproval === course._id}
                            className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300 disabled:opacity-50"
                            title={locale === 'ar' ? 'إرسال للموافقة' : 'Submit for Approval'}
                          >
                            {submittingApproval === course._id ? (
                              <div className="w-5 h-5 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Send className="w-5 h-5" />
                            )}
                          </button>
                        )}

                        {/* Delete Button (Admin only) */}
                        {canDelete(course) && (
                          <button
                            onClick={() => {
                              setCourseToDelete(course);
                              setDeleteModalOpen(true);
                            }}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            title={t('delete') || 'Delete'}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && courses.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 dark:bg-slate-700 border-t border-gray-200 dark:border-gray-600 flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              {t('page') || 'Page'} {currentPage} {t('of') || 'of'} {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-slate-600 dark:text-white"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-slate-600 dark:text-white"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {deleteModalOpen && courseToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('deleteConfirmTitle') || 'Delete Course'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t('deleteConfirmMessage', { course: getLocalizedTitle(courseToDelete.title) }) || `Are you sure you want to delete "${getLocalizedTitle(courseToDelete.title)}"?`}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setCourseToDelete(null);
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition"
              >
                {t('cancel') || 'Cancel'}
              </button>
              <button
                onClick={handleDeleteCourse}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                {t('delete') || 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
