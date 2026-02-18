import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { CheckCircle, Mail, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Auth.verifyEmail' });

  
  return {
    title: t('emailVerifiedSuccess') || 'Email Verified Successfully',
    description: t('emailVerifiedSuccessDesc') || 'Your email has been successfully verified.',
  };
}

export default async function VerifyEmailSuccessPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Auth.verifyEmail' });

  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>
        
        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t('emailVerifiedSuccess') || 'Email Verified!'}
        </h1>
        
        {/* Description */}
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {t('emailVerifiedSuccessMessage') || 'Your email has been successfully verified. You can now enroll in courses and access all features.'}
        </p>
        
        {/* Email Icon */}
        <div className="flex items-center justify-center gap-2 mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span className="text-sm text-blue-800 dark:text-blue-200">
            {t('emailConfirmed') || 'Email confirmed successfully'}
          </span>
        </div>
        
        {/* Action Buttons */}
        <div className="space-y-3">
          <Link 
            href="/courses"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            {t('browseCourses') || 'Browse Courses'}
            <ArrowRight className="w-4 h-4" />
          </Link>
          
          <Link 
            href="/dashboard"
            className="w-full flex items-center justify-center py-3 px-4 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition-colors"
          >
            {t('goToDashboard') || 'Go to Dashboard'}
          </Link>
        </div>
        
        {/* Footer */}
        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          {t('thankYou') || 'Thank you for verifying your email!'}
        </p>
      </div>
    </div>
  );
}
