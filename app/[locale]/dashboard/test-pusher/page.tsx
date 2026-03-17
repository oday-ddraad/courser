import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import connectDB from '@/lib/mongodb/connection';
import { User } from '@/lib/mongodb/models';
import { redirect } from 'next/navigation';
import PusherTestForm from '@/components/admin/PusherTestForm';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin' });

  return {
    title: t('testPusherNotifications'),
    description: t('testPusherNotificationsDesc'),
  };
}

export default async function TestPusherPage({ params }: Props) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user || !['admin', 'instructor'].includes(session.user.role)) {
    redirect(`/${locale}/forbidden`);
  }

  // Connect to database
  await connectDB();

  // Fetch all users for the dropdown
  const users = await User.find({}, 'name email _id')
    .sort({ name: 1 })
    .lean();

  const serializedUsers = users.map(user => ({
    ...user,
    _id: user._id.toString()
  }));

  const t = await getTranslations({ locale, namespace: 'admin' });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          {t('testPusherNotifications')}
        </h1>

        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
          <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
            {t('howToTest')}
          </h3>
          <ol className="list-decimal list-inside space-y-1 text-blue-700 dark:text-blue-200 text-sm">
            <li>{t('openBrowserConsole')}</li>
            <li>{t('selectTargetUser')}</li>
            <li>{t('chooseNotificationType')}</li>
            <li>{t('clickSendButton')}</li>
            <li>{t('checkConsoleLogs')}</li>
            <li>{t('verifyUINotifications')}</li>
          </ol>
        </div>

        <PusherTestForm
          users={serializedUsers}
          currentUserId={session.user.id}
          locale={locale}
        />
      </div>
    </div>
  );
}
