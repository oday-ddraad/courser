'use client';

import QRCodeDisplay from './QRCodeDisplay';
import PaymentReferenceCode from './PaymentReferenceCode';

interface PaymentDetailsPanelProps {
  methodName: string;
  paymentAddress: string;
  instructions?: string;
  qrCodeBase64?: string;
  referenceCode?: string;
  className?: string;
}

export default function PaymentDetailsPanel({
  methodName,
  paymentAddress,
  instructions,
  qrCodeBase64,
  referenceCode,
  className = '',
}: PaymentDetailsPanelProps) {
  return (
    <section className={['space-y-4 rounded-xl border border-gray-200 p-4 dark:border-gray-700', className].join(' ')}>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{methodName}</h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Payment address / account</p>
        <p className="mt-1 break-all rounded bg-gray-50 p-2 text-sm dark:bg-gray-800">{paymentAddress}</p>
      </div>

      {referenceCode ? <PaymentReferenceCode code={referenceCode} /> : null}

      {instructions ? (
        <div>
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Instructions</p>
          <p className="mt-1 whitespace-pre-line text-sm text-gray-600 dark:text-gray-300">{instructions}</p>
        </div>
      ) : null}

      <QRCodeDisplay qrCodeBase64={qrCodeBase64} />
    </section>
  );
}
