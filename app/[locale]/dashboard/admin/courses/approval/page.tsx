import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import connectDB from '@/lib/mongodb/connection';
import { Course, User } from '@/lib/mongodb/models';
import CourseApprovalDashboard from '@/components/courses/CourseApprovalDashboard';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'courses' });
  
  return {
    title: t('courseApproval') || 'Course Approval',
  };
}

export default async function CourseApprovalPage({ params }: Props) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id || session.user.role !== 'admin') {
    redirect(`/${locale}/login`);
  }

  await connectDB();
  
  // Fetch pending courses with instructor info
  const pendingCourses = await Course.find({ approvalStatus: 'pending' })
    .populate('instructorId', 'name email')
    .sort({ submittedForApprovalAt: -1 })
    .lean();

  // Fetch recently approved/rejected courses
  const recentDecisions = await Course.find({
    approvalStatus: { $in: ['approved', 'rejected'] },
    approvalDate: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
  })
    .populate('instructorId', 'name email')
    .populate('approvedBy', 'name')
    .sort({ approvalDate: -1 })
    .limit(10)
    .lean();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {locale === 'ar' ? 'الموافقة على الدورات' : locale === 'de' ? 'Kursgenehmigung' : 'Course Approval'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {locale === 'ar' 
            ? 'مراجعة واعتماد الدورات المقدمة من المدربين'
            : locale === 'de' 
              ? 'Überprüfen und genehmigen Sie Kurse, die von Dozenten eingereicht wurden'
              : 'Review and approve courses submitted by instructors'}
        </p>
      </div>

      <CourseApprovalDashboard locale={locale} />

    </div>
  );
}
