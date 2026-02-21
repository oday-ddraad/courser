import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import CourseCreationWizard from '@/components/courses/CourseCreationWizard';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'courses' });
  
  return {
    title: t('createCourse') || 'Create Course',
  };
}

export default async function CreateCoursePage({ params }: Props) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id || session.user.role !== 'instructor') {
    redirect(`/${locale}/login`);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {locale === 'ar' ? 'إنشاء دورة جديدة' : locale === 'de' ? 'Neuen Kurs erstellen' : 'Create New Course'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {locale === 'ar' 
              ? 'املأ التفاصيل أدناه لإنشاء دورتك. سيتم مراجعة دورتك من قبل المشرف قبل النشر.'
              : locale === 'de' 
                ? 'Füllen Sie die Details unten aus, um Ihren Kurs zu erstellen. Ihr Kurs wird vor der Veröffentlichung von einem Administrator geprüft.'
                : 'Fill in the details below to create your course. Your course will be reviewed by an admin before publishing.'}
          </p>
        </div>

        <CourseCreationWizard locale={locale} userRole="instructor" />

      </div>
    </div>
  );
}
