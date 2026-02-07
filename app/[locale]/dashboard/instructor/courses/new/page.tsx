import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import connectDB from '@/lib/mongodb/connection';
import CourseCreationForm from '@/components/courses/CourseCreationForm';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Dashboard.instructor' });
  
  return {
    title: t('createCourse'),
  };
}

export default async function NewCoursePage({ 
  params 
}: { 
  params: Promise<{ locale: string }> 
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Dashboard.instructor' });
  
  const session = await getServerSession(authOptions);
  
  // Check if user is instructor or admin
  if (!session?.user?.id || !['instructor', 'admin'].includes(session.user.role)) {
    redirect(`/${locale}/forbidden`);
  }
  
  await connectDB();
  
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('createCourse')}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Create a new course with multi-language content
        </p>
      </div>
      
      <CourseCreationForm locale={locale} />
    </div>
  );
}
