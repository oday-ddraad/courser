import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { getTranslations } from 'next-intl/server';
import { authOptions } from '@/lib/auth/config';
import connectDB from '@/lib/mongodb/connection';
import { Enrollment, Payment, PaymentMethod } from '@/lib/mongodb/models';
import PaymentStatusBanner from '@/components/payments/PaymentStatusBanner';
import PaymentMethodSelector from '@/components/payments/PaymentMethodSelector';
import PaymentDetailsPanel from '@/components/payments/PaymentDetailsPanel';
import PaymentProofSection from '@/components/payments/PaymentProofSection';


interface Props {
  params: Promise<{ locale: string; enrollmentId: string }>;
}

export default async function PaymentPage({ params }: Props) {
  const { locale, enrollmentId } = await params;
  const tCourses = await getTranslations({ locale, namespace: 'courses' });
  const tPayment = await getTranslations({ locale, namespace: 'Payment' });

  const tp = (key: string, fallback: string) => {
    try {
      return tPayment(key as never);
    } catch {
      return fallback;
    }
  };


  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/payment/${enrollmentId}`);
  }

  await connectDB();

  const enrollment = await Enrollment.findById(enrollmentId).lean();
  if (!enrollment) {
    redirect(`/${locale}/courses`);
  }

  if (enrollment.userId?.toString() !== session.user.id) {
    redirect(`/${locale}/forbidden`);
  }

  const payment = await Payment.findOne({ enrollmentId: enrollment._id })
    .populate('paymentMethodId')
    .lean();

  if (!payment) {
    redirect(`/${locale}/courses`);
  }

  const userCountry = (session.user as any).country || null;
  const methodsQuery: any = { isActive: true };
  if (userCountry) {
    methodsQuery.$or = [{ isGlobal: true }, { countries: userCountry.toUpperCase() }];
  } else {
    methodsQuery.isGlobal = true;
  }

  const availableMethods = await PaymentMethod.find(methodsQuery)
    .sort({ sortOrder: 1, createdAt: -1 })
    .lean();

  const selectedMethodId =
    payment.paymentMethodId?._id?.toString?.() ||
    payment.paymentMethodId?.toString?.() ||
    '';

  const selectedMethod =
    availableMethods.find((m: any) => m._id.toString() === selectedMethodId) ||
    availableMethods[0];

  const methodOptions = availableMethods.map((m: any) => ({
    id: m._id.toString(),
    name: m.name?.[locale as 'en' | 'de' | 'ar'] || m.name?.en || tp('methodFallback', 'Payment Method'),
    description: m.description?.[locale as 'en' | 'de' | 'ar'] || m.description?.en || '',
    logo: m.logo || '',
  }));


  const selectedMethodName =
    selectedMethod?.name?.[locale as 'en' | 'de' | 'ar'] ||
    selectedMethod?.name?.en ||
    tp('methodFallback', 'Payment Method');


  const selectedInstructions =
    selectedMethod?.instructions?.[locale as 'en' | 'de' | 'ar'] ||
    selectedMethod?.instructions?.en ||
    '';

  return (
    <div className="min-h-screen bg-gray-50 py-8 dark:bg-gray-900">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {tCourses('enrollNow')} - {tp('pageTitle', 'Payment')}
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            {tp('pageSubtitle', 'Complete your manual payment and submit proof for admin review.')}
          </p>

        </div>

        <PaymentStatusBanner
          status={payment.status}
          expiresAt={payment.expiresAt}
          message={
            payment.status === 'pending'
              ? tp('statusMessagePending', 'Your payment is pending review. Submit proof to continue.')
              : payment.status === 'rejected'
              ? payment.rejectionReason || tp('statusMessageRejectedFallback', 'Your payment was rejected. Please resubmit.')
              : undefined
          }

          className="mb-6"
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
              {tp('selectMethodTitle', 'Select Payment Method')}
            </h2>

            <PaymentMethodSelector methods={methodOptions} selectedId={selectedMethodId} />
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
              {tp('detailsTitle', 'Payment Details')}
            </h2>

            {selectedMethod ? (
              <PaymentDetailsPanel
                methodName={selectedMethodName}
                paymentAddress={selectedMethod.paymentAddress || tp('notAvailable', 'N/A')}
                instructions={selectedInstructions}
                qrCodeBase64={selectedMethod.qrCode || ''}
                referenceCode={payment.referenceCode}
              />

            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {tp('noMethodsAvailable', 'No payment methods available for your country.')}
              </p>

            )}
          </section>
        </div>

        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            {tp('submitProofTitle', 'Submit Payment Proof')}
          </h2>

          <PaymentProofSection
            paymentId={payment._id.toString()}
            requireOperationNumber={selectedMethod?.requiresOperationNumber ?? true}
          />

        </section>
      </div>
    </div>
  );
}
