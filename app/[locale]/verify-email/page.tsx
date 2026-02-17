'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

function VerifyEmailContent() {
  const t = useTranslations('Auth');
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/auth/verify-email/confirm?token=${token}`);
        const data = await response.json();

        if (data.success) {
          setStatus('success');
          setMessage('Your email has been verified successfully!');
          
          // Redirect to profile completion after 3 seconds
          setTimeout(() => {
            router.push('/complete-profile');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Failed to verify email');
        }
      } catch (error) {
        setStatus('error');
        setMessage('An error occurred while verifying your email');
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 mx-auto mb-4 text-blue-600 animate-spin" />
            <h1 className="text-2xl font-bold mb-2">Verifying your email...</h1>
            <p className="text-gray-600 dark:text-gray-400">Please wait while we verify your email address.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h1 className="text-2xl font-bold mb-2 text-green-600">Email Verified!</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{message}</p>
            <p className="text-sm text-gray-500">Redirecting to profile completion...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h1 className="text-2xl font-bold mb-2 text-red-600">Verification Failed</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
            <Link
              href="/login"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
