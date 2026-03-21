'use client';

import PaymentDetailsPanel from './PaymentDetailsPanel';

interface PaymentMethodPreviewModalProps {
  open: boolean;
  onClose: () => void;
  method?: {
    name: string;
    paymentAddress: string;
    instructions?: string;
    qrCodeBase64?: string;
  };
}

export default function PaymentMethodPreviewModal({
  open,
  onClose,
  method,
}: PaymentMethodPreviewModalProps) {
  if (!open || !method) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-xl bg-white p-4 shadow-lg dark:bg-gray-900">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Payment Method Preview</h3>
          <button type="button" onClick={onClose} className="rounded border px-2 py-1 text-xs">
            Close
          </button>
        </div>
        <PaymentDetailsPanel
          methodName={method.name}
          paymentAddress={method.paymentAddress}
          instructions={method.instructions}
          qrCodeBase64={method.qrCodeBase64}
          referenceCode="ENROLL-DEMO01"
        />
      </div>
    </div>
  );
}
