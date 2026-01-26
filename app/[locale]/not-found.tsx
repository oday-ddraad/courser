import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function NotFound() {
  const t = useTranslations('Errors');

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-9xl font-black text-slate-200 dark:text-slate-800">404</h1>
      <h2 className="mt-4 text-3xl font-bold text-slate-900 dark:text-white">
        {t('notFoundTitle')}
      </h2>
      <p className="mt-2 max-w-md text-slate-600 dark:text-slate-400">
        {t('notFoundDesc')}
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-blue-600 px-8 py-3 font-semibold text-white shadow-lg transition-all hover:bg-blue-700 active:scale-95"
      >
        {t('goHome')}
      </Link>
    </div>
  );
}