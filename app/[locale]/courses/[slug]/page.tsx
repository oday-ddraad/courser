import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import connectDB from '@/lib/mongodb/connection';
import { Course, Enrollment } from '@/lib/mongodb/models';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Star, 
  Clock, 
  Users, 
  BookOpen, 
  PlayCircle,
  CheckCircle,
  Globe,
  Calendar
} from 'lucide-react';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  
  await connectDB();
  const course = await Course.findOne({ slug, isPublished: true }).lean();
  
  if (!course) {
    return {
      title: 'Course Not Found',
    };
  }
  
  const title = course.title[locale as keyof typeof course.title] || course.title.en;
  const description = course.description[locale as keyof typeof course.description] || course.description.en;
  
  return {
    title: `${title} | Courses`,
    description,
  };
}

export default async function CoursePage({ params }: Props) {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale, namespace: 'courses' });
  
  const session = await getServerSession(authOptions);
  
  await connectDB();
  
  // Fetch course
  const course = await Course.findOne({ slug })
    .populate('instructorId', 'name avatar instructorProfile')
    .lean();
  
  if (!course) {
    notFound();
  }
  
  // Check if user is enrolled
  let enrollment = null;
  let isEnrolled = false;
  
  if (session?.user?.id) {
    enrollment = await Enrollment.findOne({
      userId: session.user.id,
      courseId: course._id,
      status: { $in: ['active', 'completed'] },
    }).lean();
    
    isEnrolled = !!enrollment;
  }
  
  // Get localized content
  const title = course.title[locale as keyof typeof course.title] || course.title.en;
  const description = course.description[locale as keyof typeof course.description] || course.description.en;
  const content = course.content[locale as keyof typeof course.content] || course.content.en;
  
  // Format price
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(price);
  };
  
  // Calculate total lessons
  const totalLessons = course.lessons?.length || 0;
  const completedLessons = enrollment?.progress?.completedLessons?.length || 0;
  const progressPercentage = enrollment?.progress?.completionPercentage || 0;
  
  // Get instructor info
  const instructor = course.instructorId as any;
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
            <Link href={`/${locale}/courses`} className="hover:text-blue-600">
              {t('allCourses')}
            </Link>
            <span>/</span>
            <span className="text-gray-900 dark:text-white">{title}</span>
          </nav>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Category & Level */}
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {course.category}
                </span>
                <span className={`
                  px-3 py-1 rounded-full text-sm font-medium
                  ${course.level === 'beginner' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
                  ${course.level === 'intermediate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : ''}
                  ${course.level === 'advanced' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : ''}
                `}>
                  {t(`levels.${course.level}`)}
                </span>
                {course.isLiveStream && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 flex items-center gap-1">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    {t('live')}
                  </span>
                )}
              </div>
              
              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {title}
              </h1>
              
              {/* Description */}
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                {description}
              </p>
              
              {/* Stats */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 dark:text-gray-400 mb-6">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span className="font-medium">{course.rating > 0 ? course.rating.toFixed(1) : '-'}</span>
                  <span>({course.reviews?.length || 0} {t('reviews')})</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-5 h-5" />
                  <span>{course.enrollmentCount} {t('students')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-5 h-5" />
                  <span>{course.duration} {t('hours')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="w-5 h-5" />
                  <span>{totalLessons} {t('lessons')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Globe className="w-5 h-5" />
                  <span>{t('multiLanguage')}</span>
                </div>
              </div>
              
              {/* Instructor */}
              {instructor && (
                <div className="flex items-center gap-3">
                  {instructor.avatar ? (
                    <Image
                      src={instructor.avatar}
                      alt={instructor.name}
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                      <span className="text-lg text-gray-600 dark:text-gray-400">
                        {instructor.name?.charAt(0) || '?'}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {t('instructor')}: {instructor.name}
                    </p>
                    {instructor.instructorProfile?.specialization && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {instructor.instructorProfile.specialization.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sticky top-4">
                {/* Thumbnail */}
                <div className="relative aspect-video rounded-lg overflow-hidden mb-4">
                  {course.thumbnail ? (
                    <Image
                      src={course.thumbnail}
                      alt={title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <BookOpen className="w-16 h-16 text-white/80" />
                    </div>
                  )}
                </div>
                
                {/* Price */}
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {course.price === 0 ? t('free') : formatPrice(course.price, course.currency)}
                  </span>
                </div>
                
                {/* Enrollment Status */}
                {isEnrolled ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">{t('enrolled')}</span>
                    </div>
                    
                    {/* Progress */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <span>{t('progress')}</span>
                        <span>{progressPercentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {completedLessons} / {totalLessons} {t('lessonsCompleted')}
                      </p>
                    </div>
                    
                    {/* Continue Learning Button */}
                    <Link
                      href={`/${locale}/courses/${slug}/lessons/${enrollment?.progress?.lastAccessedLesson || course.lessons?.[0]?._id}`}
                      className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
                    >
                      {t('continueLearning')}
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Link
                      href={`/${locale}/courses/${slug}/enroll`}
                      className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
                    >
                      {t('enrollNow')}
                    </Link>
                    
                    {/* Preview Button */}
                    {course.lessons?.some((l: any) => l.isPreview) && (
                      <Link
                        href={`/${locale}/courses/${slug}/lessons/${course.lessons.find((l: any) => l.isPreview)?._id}`}
                        className="block w-full text-center bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium py-3 rounded-lg transition-colors"
                      >
                        {t('previewCourse')}
                      </Link>
                    )}
                  </div>
                )}
                
                {/* Course Includes */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                    {t('courseIncludes')}
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-center gap-2">
                      <PlayCircle className="w-4 h-4" />
                      {course.duration} {t('hoursOnDemandVideo')}
                    </li>
                    <li className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      {totalLessons} {t('lessons')}
                    </li>
                    <li className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      {t('fullLifetimeAccess')}
                    </li>
                    <li className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {t('accessOnMobileAndTV')}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Course Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <section className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {t('description')}
              </h2>
              <div className="prose dark:prose-invert max-w-none">
                {content || description}
              </div>
            </section>
            
            {/* Lessons */}
            <section className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {t('courseContent')}
              </h2>
              <div className="space-y-2">
                {course.lessons?.map((lesson: any, index: number) => {
                  const lessonTitle = lesson.title[locale as keyof typeof lesson.title] || lesson.title.en;
                  const isCompleted = enrollment?.progress?.completedLessons?.some(
                    (id: any) => id.toString() === lesson._id.toString()
                  );
                  
                  return (
                    <div
                      key={lesson._id.toString()}
                      className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-400">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {lessonTitle}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {lesson.duration} {t('minutes')}
                            {lesson.isPreview && (
                              <span className="ml-2 text-blue-600 dark:text-blue-400">
                                {t('preview')}
                              </span>
                            )}
                            {lesson.isLiveStream && (
                              <span className="ml-2 text-red-600 dark:text-red-400">
                                {t('live')}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isCompleted && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                        {lesson.isPreview || isEnrolled ? (
                          <Link
                            href={`/${locale}/courses/${slug}/lessons/${lesson._id}`}
                            className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          >
                            {isCompleted ? t('rewatch') : t('watch')}
                          </Link>
                        ) : (
                          <span className="px-4 py-2 text-sm text-gray-400">
                            <PlayCircle className="w-5 h-5" />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
            
            {/* Reviews */}
            {course.reviews && course.reviews.length > 0 && (
              <section className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {t('studentReviews')}
                </h2>
                <div className="space-y-4">
                  {course.reviews.slice(0, 5).map((review: any) => (
                    <div
                      key={review._id?.toString()}
                      className="border-b border-gray-200 dark:border-gray-700 last:border-0 pb-4 last:pb-0"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating
                                  ? 'text-yellow-500 fill-yellow-500'
                                  : 'text-gray-300 dark:text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(review.createdAt).toLocaleDateString(locale)}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300">
                        {review.comment}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
