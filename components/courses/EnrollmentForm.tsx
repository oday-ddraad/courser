'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface EnrollmentFormProps {
  courseId: string;
  courseSlug: string;
  price: number;
  currency: string;
  locale: string;
}

export default function EnrollmentForm({ 
  courseId, 
  courseSlug, 
  price, 
  currency,
  locale 
}: EnrollmentFormProps) {
  const router = useRouter();
  const t = useTranslations('courses');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agreedToTerms) {
      setError('Please agree to the terms to continue');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to enroll');
      }

      // Redirect to course page or payment page
      if (price > 0 && data.data.paymentStatus === 'pending') {
        // Redirect to payment page
        router.push(`/${locale}/payment/${data.data._id}`);
      } else {
        // Free course or already approved, go to course
        router.push(`/${locale}/courses/${courseSlug}/lessons`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFree = price === 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Terms Agreement */}
      <div className="space-y-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            I agree to the{' '}
            <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">
              Privacy Policy
            </a>
            . I understand that I will have access to course materials and my progress will be tracked.
          </span>
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || !agreedToTerms}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Processing...
          </span>
        ) : isFree ? (
          'Complete Free Enrollment'
        ) : (
          `Proceed to Payment (${new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency,
          }).format(price)})`
        )}
      </button>

      {/* Back Link */}
      <button
        type="button"
        onClick={() => router.back()}
        className="w-full text-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        ← Back to Course
      </button>
    </form>
  );
}
