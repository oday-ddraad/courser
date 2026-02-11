'use client';

import { useSession } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation';
import { hasPermission } from '@/lib/auth/permissions';
import { useTranslations, useLocale } from 'next-intl';
import { useState, useEffect, use } from 'react';

import Link from 'next/link';
import { 
  ArrowLeft, 
  Search, 
  Users, 
  Trash2, 
  GraduationCap,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Mail,
  User
} from 'lucide-react';

interface Enrollment {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    isActive: boolean;
  };
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  enrolledAt: string;
  progress: {
    completionPercentage: number;
    completedLessons: string[];
    lastAccessedAt?: string;
  };
}

interface Course {
  _id: string;
  title: {
    en: string;
    de: string;
    ar: string;
  };
  slug: string;
  enrollmentCount: number;
}

interface Statistics {
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  pendingEnrollments: number;
  averageProgress: number;
}

export default function CourseStudentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations('Dashboard.admin.courses');
  const locale = useLocale();
  const { id: courseId } = use(params);


  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [course, setCourse] = useState<Course | null>(null);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [enrollmentToDelete, setEnrollmentToDelete] = useState<Enrollment | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {

    if (status !== 'loading' && session && hasPermission(session.user.role, 'course.manage')) {
      fetchEnrollments();
    }
  }, [courseId, currentPage, filterStatus, status, session]);

  if (status === 'loading') {
    return <div className="p-6">Loading...</div>;
  }

  if (!session || !hasPermission(session.user.role, 'course.manage')) {
    redirect('/forbidden');
  }

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      setIsSearching(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(searchQuery && { search: searchQuery }),
        ...(filterStatus && { status: filterStatus }),
      });

      console.log('Fetching enrollments for course:', courseId);
      const response = await fetch(`/api/courses/${courseId}/enrollments?${params}`);
      const data = await response.json();
      
      console.log('API Response:', data);
      
      if (data.success) {
        setEnrollments(data.data.enrollments || []);
        setCourse(data.data.course);
        setStatistics(data.data.statistics);
        setTotalPages(data.data.pagination?.totalPages || 1);
      } else {
        console.error('API returned error:', data.error);
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };



  const handleSearch = () => {
    setCurrentPage(1);
    fetchEnrollments();
  };

  const handleDeleteEnrollment = async () => {
    if (!enrollmentToDelete) return;

    try {
      const response = await fetch(`/api/courses/${courseId}/enrollments`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId: enrollmentToDelete._id }),
      });

      if (response.ok) {
        setEnrollments(enrollments.filter(e => e._id !== enrollmentToDelete._id));
        setDeleteModalOpen(false);
        setEnrollmentToDelete(null);
        // Refresh statistics
        fetchEnrollments();
      } else {
        alert('Failed to remove student');
      }
    } catch (error) {
      console.error('Error removing student:', error);
      alert('Error removing student');
    }
  };

  const getLocalizedTitle = (title: Course['title']) => {
    return title[locale as keyof typeof title] || title.en;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            <GraduationCap className="w-3 h-3 mr-1" />
            Completed
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/dashboard/admin/courses"
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('manageStudents') || 'Manage Students'}
            </h1>

          </div>
          {course && (
            <p className="text-gray-600 dark:text-gray-400">
              {getLocalizedTitle(course.title)} • {course.enrollmentCount} students enrolled
            </p>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                <Users className="w-6 h-6" />
              </div>
          <div className="ml-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('students') || 'Students'}</p>

                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {statistics.totalEnrollments}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400">
                <CheckCircle className="w-6 h-6" />
              </div>
          <div className="ml-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('active') || 'Active'}</p>

                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {statistics.activeEnrollments}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400">
                <GraduationCap className="w-6 h-6" />
              </div>
          <div className="ml-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('completed') || 'Completed'}</p>

                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {statistics.completedEnrollments}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400">
                <Clock className="w-6 h-6" />
              </div>
          <div className="ml-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('averageProgress') || 'Avg Progress'}</p>

                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.round(statistics.averageProgress || 0)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={t('searchByNameOrEmail') || 'Search by name or email...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
            />

          </div>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          >
            <option value="">{t('allStatuses') || 'All Statuses'}</option>
            <option value="active">{t('active') || 'Active'}</option>
            <option value="completed">{t('completed') || 'Completed'}</option>
            <option value="pending">{t('pending') || 'Pending'}</option>
            <option value="cancelled">{t('cancelled') || 'Cancelled'}</option>

          </select>
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isSearching ? (t('searching') || 'Searching...') : (t('search') || 'Search')}
          </button>

        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">{t('loadingStudents') || 'Loading students...'}</p>
          </div>

        ) : !enrollments || enrollments.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">{t('noStudentsEnrolled') || 'No students enrolled yet'}</p>
          </div>

        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('student') || 'Student'}
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('status') || 'Status'}
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('progress') || 'Progress'}
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('enrolledDate') || 'Enrolled Date'}
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('lastAccess') || 'Last Access'}
                  </th>

                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('actions') || 'Actions'}
                  </th>

                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {enrollments.map((enrollment) => (
                  <tr key={enrollment._id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                          {enrollment.userId?.avatar ? (
                            <img
                              src={enrollment.userId.avatar}
                              alt={enrollment.userId.name}
                              className="h-10 w-10 rounded-full"
                            />
                          ) : (
                            <User className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {enrollment.userId?.name || 'Unknown'}
                          {!enrollment.userId?.isActive && (
                              <span className="ml-2 inline-flex px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                {t('inactive') || 'Inactive'}
                              </span>
                            )}

                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            {enrollment.userId?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(enrollment.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${enrollment.progress?.completionPercentage || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900 dark:text-white">
                          {Math.round(enrollment.progress?.completionPercentage || 0)}%
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {enrollment.progress?.completedLessons?.length || 0} {t('lessonsCompleted') || 'lessons completed'}
                      </div>

                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {new Date(enrollment.enrolledAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {enrollment.progress?.lastAccessedAt
                          ? new Date(enrollment.progress.lastAccessedAt).toLocaleDateString()
                          : (t('never') || 'Never')}
                      </div>

                    </td>
                    <td className="px-6 py-4 text-right">
                      {session.user.role === 'admin' && (
                        <button
                          onClick={() => {
                            setEnrollmentToDelete(enrollment);
                            setDeleteModalOpen(true);
                          }}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title={t('removeFromCourse') || 'Remove from course'}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>

                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && enrollments.length > 0 && (
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
      {deleteModalOpen && enrollmentToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('removeStudent') || 'Remove Student'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t('removeStudentConfirm') || 'Are you sure you want to remove'} <strong>{enrollmentToDelete.userId?.name}</strong> {t('fromThisCourse') || 'from this course?'} {t('actionCannotBeUndone') || 'This action cannot be undone.'}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setEnrollmentToDelete(null);
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition"
              >
                {t('cancel') || 'Cancel'}
              </button>
              <button
                onClick={handleDeleteEnrollment}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                {t('remove') || 'Remove'}
              </button>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
