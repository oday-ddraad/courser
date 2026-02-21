import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import connectDB from '@/lib/mongodb/connection';
import { Course } from '@/lib/mongodb/models';
import Link from 'next/link';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'courses' });
  
  return {
    title: t('myCourses') || 'My Courses',
  };
}

export default async function InstructorCoursesPage({ params }: Props) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id || session.user.role !== 'instructor') {
    redirect(`/${locale}/login`);
  }

  await connectDB();
  
  // Fetch instructor's courses
  const courses = await Course.find({ instructorId: session.user.id })
    .sort({ createdAt: -1 })
    .lean();

  const t = await getTranslations({ locale, namespace: 'courses' });

  const getLocalizedTitle = (title: { en: string; de: string; ar: string }) => {
    return title[locale as keyof typeof title] || title.en || 'Untitled Course';
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    };
    const labels: Record<string, Record<string, string>> = {
      pending: { en: 'Pending Approval', de: 'Genehmigung ausstehend', ar: 'في انتظار الموافقة' },
      approved: { en: 'Approved', de: 'Genehmigt', ar: 'تمت الموافقة' },
      rejected: { en: 'Rejected', de: 'Abgelehnt', ar: 'مرفوض' },
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status]?.[locale] || status}
      </span>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {locale === 'ar' ? 'دوراتي' : locale === 'de' ? 'Meine Kurse' : 'My Courses'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {locale === 'ar' ? 'إدارة دوراتك ودروسك' : locale === 'de' ? 'Verwalten Sie Ihre Kurse und Lektionen' : 'Manage your courses and lessons'}
          </p>
        </div>
        <Link
          href={`/${locale}/dashboard/instructor/courses/create`}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {locale === 'ar' ? 'إنشاء دورة' : locale === 'de' ? 'Kurs erstellen' : 'Create Course'}
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {locale === 'ar' ? 'لا توجد دورات بعد' : locale === 'de' ? 'Noch keine Kurse' : 'No courses yet'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {locale === 'ar' ? 'ابدأ بإنشاء دورتك الأولى' : locale === 'de' ? 'Erstellen Sie Ihren ersten Kurs' : 'Start by creating your first course'}
          </p>
          <Link
            href={`/${locale}/dashboard/instructor/courses/create`}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {locale === 'ar' ? 'إنشاء دورة' : locale === 'de' ? 'Kurs erstellen' : 'Create Course'}
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {courses.map((course: any) => (
            <div
              key={course._id.toString()}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusBadge(course.approvalStatus)}
                      {course.isPublished && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full text-xs font-medium">
                          {locale === 'ar' ? 'منشور' : 'Published'}
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {getLocalizedTitle(course.title)}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {course.courseType === 'live' 
                        ? (locale === 'ar' ? 'دورة مباشرة' : locale === 'de' ? 'Live-Kurs' : 'Live Course')
                        : (locale === 'ar' ? 'دورة مسجلة' : locale === 'de' ? 'Aufgezeichneter Kurs' : 'Recorded Course')
                      } • {course.lessons.length} {locale === 'ar' ? 'دروس' : locale === 'de' ? 'Lektionen' : 'lessons'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      ${course.price}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {course.enrollmentCount} {locale === 'ar' ? 'طلاب' : locale === 'de' ? 'Studenten' : 'students'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/${locale}/dashboard/instructor/courses/${course.slug}/edit`}
                    className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    {locale === 'ar' ? 'تعديل' : 'Edit'}
                  </Link>
                  <Link
                    href={`/${locale}/dashboard/instructor/courses/${course.slug}/lessons`}
                    className="px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    {locale === 'ar' ? 'الدروس' : 'Lessons'}
                  </Link>
                  <Link
                    href={`/${locale}/dashboard/instructor/courses/${course.slug}/groups`}
                    className="px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {locale === 'ar' ? 'المجموعات' : 'Groups'}
                  </Link>
                  {course.approvalStatus === 'pending' && (
                    <button
                      disabled
                      className="px-3 py-1.5 text-sm text-gray-400 cursor-not-allowed flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      {locale === 'ar' ? 'في انتظار الموافقة' : 'Pending Approval'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
