import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import NotificationsList from '@/components/notifications/NotificationsList';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'notifications' });

  return {
    title: t('title'),
  };
}

export default function NotificationsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
        Notifications
      </h1>
      <NotificationsList />
    </div>
  );
}
