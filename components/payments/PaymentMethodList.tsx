'use client';

import PaymentMethodCard from './PaymentMethodCard';

export interface PaymentMethodListItem {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  isActive?: boolean;
}

interface PaymentMethodListProps {
  items: PaymentMethodListItem[];
  onEdit?: (id: string) => void;
  onPreview?: (id: string) => void;
  onToggleActive?: (id: string, next: boolean) => void;
  className?: string;
}

export default function PaymentMethodList({
  items,
  onEdit,
  onPreview,
  onToggleActive,
  className = '',
}: PaymentMethodListProps) {
  return (
    <div className={['space-y-3', className].join(' ')}>
      {items.map((item) => (
        <div key={item.id} className="rounded-xl border border-gray-200 p-3 dark:border-gray-700">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
            <PaymentMethodCard
              id={item.id}
              name={item.name}
              description={item.description}
              logo={item.logo}
            />
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => onPreview?.(item.id)} className="rounded border px-2 py-1 text-xs">
                Preview
              </button>
              <button type="button" onClick={() => onEdit?.(item.id)} className="rounded border px-2 py-1 text-xs">
                Edit
              </button>
              <button
                type="button"
                onClick={() => onToggleActive?.(item.id, !item.isActive)}
                className="rounded border px-2 py-1 text-xs"
              >
                {item.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      ))}
      {items.length === 0 ? <p className="text-sm text-gray-500">No payment methods found.</p> : null}
    </div>
  );
}
