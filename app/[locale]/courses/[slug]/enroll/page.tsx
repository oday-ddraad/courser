import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import connectDB from '@/lib/mongodb/connection';
import { Course, Enrollment } from '@/lib/mongodb/models';
import EnrollmentForm from '@/components/courses/EnrollmentForm';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  
  await connectDB();
  const course = await Course.findOne({ slug, isPublished: true }).lean();
  
  if (!course) {
    return { title: 'Course Not Found' };
  }
  
  const title = course.title[locale as keyof typeof course.title] || course.title.en;
  
  return {
    title: `Enroll in ${title}`,
  };
}

export default async function EnrollPage({ params }: Props) {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale, namespace: 'courses' });
  
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/courses/${slug}/enroll`);
  }
  
  await connectDB();
  
  // Fetch course
  const course = await Course.findOne({ slug, isPublished: true })
    .populate('instructorId', 'name')
    .lean();
  
  if (!course) {
    notFound();
  }
  
  // Check if already enrolled
  const existingEnrollment = await Enrollment.findOne({
    userId: session.user.id,
    courseId: course._id,
    status: { $in: ['active', 'completed'] },
  }).lean();
  
  if (existingEnrollment) {
    redirect(`/${locale}/courses/${slug}?alreadyEnrolled=true`);
  }
  
  // Get localized content
  const title = course.title[locale as keyof typeof course.title] || course.title.en;
  const description = course.description[locale as keyof typeof course.description] || course.description.en;
  
  // Format price
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(price);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 px-6 py-8 text-center">
            <h1 className="text-3xl font-bold text-white mb-2">
              {t('enrollNow')}
            </h1>
            <p className="text-blue-100">
              {title}
            </p>
          </div>
          
          <div className="p-6 md:p-8">
            {/* Course Summary */}
            <div className="mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Course Summary
              </h2>
              
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                  {title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  {description}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="block">Instructor: {(course.instructorId as any)?.name}</span>
                    <span className="block">{course.duration} hours • {course.lessons?.length || 0} lessons</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {course.price === 0 ? t('free') : formatPrice(course.price, course.currency)}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Enrollment Form */}
            <EnrollmentForm 
              courseId={course._id.toString()}
              courseSlug={slug}
              price={course.price}
              currency={course.currency}
              locale={locale}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
