'use client';

import { useSession } from 'next-auth/react';
import { redirect, useParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Search, 
  Users, 
  GraduationCap,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Mail,
  User,
  BookOpen
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
  instructorIds: string[];
}

interface Statistics {
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  pendingEnrollments: number;
  averageProgress: number;
}

export default function InstructorCourseStudentsPage() {
  const { data: session, status } = useSession();
  const t = useTranslations('Dashboard.instructor.courses');
  const locale = useLocale();
  const params = useParams();
  const slug = params.slug as string;

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [course, setCourse] = useState<Course | null>(null);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (status !== 'loading' && session) {
      fetchCourseAndEnrollments();
    }
  }, [slug, currentPage, filterStatus, status, session]);

  if (status === 'loading') {
    return <div className="p-6">Loading...</div>;
  }

  if (!session || session.user.role !== 'instructor') {
    redirect('/forbidden');
  }

  const fetchCourseAndEnrollments = async () => {
    try {
      setLoading(true);
      
      // First fetch course to verify ownership
      const courseResponse = await fetch(`/api/courses?slug=${slug}&myCourses=true`);
      const courseData = await courseResponse.json();
      
      if (!courseData.success || courseData.data.length === 0) {
        redirect('/forbidden');
        return;
      }
      
      const courseInfo = courseData.data[0];
      setCourse(courseInfo);
      
      // Check if instructor owns this course
      const isInstructor = courseInfo.instructorIds.includes(session?.user?.id);
      if (!isInstructor) {
        redirect('/forbidden');
        return;
      }

      // Fetch enrollments
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(searchQuery && { search: searchQuery }),
        ...(filterStatus && { status: filterStatus }),
      });

      const response = await fetch(`/api/courses/${courseInfo._id}/enrollments?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setEnrollments(data.data.enrollments || []);
        setStatistics(data.data.statistics);
        setTotalPages(data.data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchCourseAndEnrollments();
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
            {locale === 'ar' ? 'نشط' : locale === 'de' ? 'Aktiv' : 'Active'}
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            <GraduationCap className="w-3 h-3 mr-1" />
            {locale === 'ar' ? 'مكتمل' : locale === 'de' ? 'Abgeschlossen' : 'Completed'}
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            {locale === 'ar' ? 'معلق' : locale === 'de' ? 'Ausstehend' : 'Pending'}
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            {locale === 'ar' ? 'ملغى' : locale === 'de' ? 'Storniert' : 'Cancelled'}
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-6">
        <div className="text-center">
          <BookOpen className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {locale === 'ar' ? 'الدورة غير موجودة' : locale === 'de' ? 'Kurs nicht gefunden' : 'Course not found'}
          </h2>
          <Link 
            href={`/${locale}/dashboard/instructor/courses`}
            className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {locale === 'ar' ? 'العودة للدورات' : locale === 'de' ? 'Zurück zu Kursen' : 'Back to courses'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href={`/${locale}/dashboard/instructor/courses`}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {locale === 'ar' ? 'إدارة الطلاب' : locale === 'de' ? 'Studenten verwalten' : 'Manage Students'}
            </h1>
          </div>
          {course && (
            <p className="text-gray-600 dark:text-gray-400">
              {getLocalizedTitle(course.title)} • {course.enrollmentCount} {locale === 'ar' ? 'طالب مسجل' : locale === 'de' ? 'eingeschriebene Studenten' : 'students enrolled'}
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
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {locale === 'ar' ? 'الطلاب' : locale === 'de' ? 'Studenten' : 'Students'}
                </p>
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
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {locale === 'ar' ? 'نشط' : locale === 'de' ? 'Aktiv' : 'Active'}
                </p>
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
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {locale === 'ar' ? 'مكتمل' : locale === 'de' ? 'Abgeschlossen' : 'Completed'}
                </p>
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
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {locale === 'ar' ? 'متوسط التقدم' : locale === 'de' ? 'Durchschn. Fortschritt' : 'Avg Progress'}
                </p>
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
              placeholder={locale === 'ar' ? 'البحث بالاسم أو البريد...' : locale === 'de' ? 'Suche nach Name oder E-Mail...' : 'Search by name or email...'}
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
            <option value="">{locale === 'ar' ? 'جميع الحالات' : locale === 'de' ? 'Alle Status' : 'All Statuses'}</option>
            <option value="active">{locale === 'ar' ? 'نشط' : locale === 'de' ? 'Aktiv' : 'Active'}</option>
            <option value="completed">{locale === 'ar' ? 'مكتمل' : locale === 'de' ? 'Abgeschlossen' : 'Completed'}</option>
            <option value="pending">{locale === 'ar' ? 'معلق' : locale === 'de' ? 'Ausstehend' : 'Pending'}</option>
            <option value="cancelled">{locale === 'ar' ? 'ملغى' : locale === 'de' ? 'Storniert' : 'Cancelled'}</option>
          </select>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            {locale === 'ar' ? 'بحث' : locale === 'de' ? 'Suchen' : 'Search'}
          </button>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              {locale === 'ar' ? 'جاري تحميل الطلاب...' : locale === 'de' ? 'Lade Studenten...' : 'Loading students...'}
            </p>
          </div>
        ) : !enrollments || enrollments.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              {locale === 'ar' ? 'لا يوجد طلاب مسجلين بعد' : locale === 'de' ? 'Noch keine Studenten eingeschrieben' : 'No students enrolled yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {locale === 'ar' ? 'الطالب' : locale === 'de' ? 'Student' : 'Student'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {locale === 'ar' ? 'الحالة' : locale === 'de' ? 'Status' : 'Status'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {locale === 'ar' ? 'التقدم' : locale === 'de' ? 'Fortschritt' : 'Progress'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {locale === 'ar' ? 'تاريخ التسجيل' : locale === 'de' ? 'Anmeldedatum' : 'Enrolled Date'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {locale === 'ar' ? 'آخر وصول' : locale === 'de' ? 'Letzter Zugriff' : 'Last Access'}
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
                                {locale === 'ar' ? 'غير نشط' : locale === 'de' ? 'Inaktiv' : 'Inactive'}
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
                        {enrollment.progress?.completedLessons?.length || 0} {locale === 'ar' ? 'دروس مكتملة' : locale === 'de' ? 'Lektionen abgeschlossen' : 'lessons completed'}
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
                          : (locale === 'ar' ? 'أبداً' : locale === 'de' ? 'Nie' : 'Never')}
                      </div>
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
              {locale === 'ar' ? 'صفحة' : locale === 'de' ? 'Seite' : 'Page'} {currentPage} {locale === 'ar' ? 'من' : locale === 'de' ? 'von' : 'of'} {totalPages}
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
    </div>
  );
}
