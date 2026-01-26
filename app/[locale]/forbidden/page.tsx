import { useTranslations } from 'next-intl';

export default function ForbiddenPage() {
  const t = useTranslations('Errors');
  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <div className="rounded-full bg-red-100 p-6 dark:bg-red-900/20">
        <svg className="h-12 w-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0-8V3m0 0l-4 4m4-4l4 4m-4 4a3 3 0 110-6 3 3 0 010 6zm0 0v4" />
        </svg>
      </div>
      <h1 className="mt-6 text-2xl font-bold">{t('forbidden')}</h1>
      <p className="text-slate-500">You do not have permission to view this resource.</p>
    </div>
  );
}