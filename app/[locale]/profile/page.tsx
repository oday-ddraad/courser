import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import ProfileView from '@/components/profile/ProfileView';
import { use } from 'react';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  
  return {
    title: 'My Profile | ' + t('title'),
    description: 'View and manage your profile information',
  };
}

export default function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <ProfileView locale={locale} />
      </div>
    </div>
  );
}
