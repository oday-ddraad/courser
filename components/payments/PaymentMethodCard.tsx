'use client';

interface PaymentMethodCardProps {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  className?: string;
}

export default function PaymentMethodCard({
  id,
  name,
  description,
  logo,
  isSelected = false,
  onSelect,
  className = '',
}: PaymentMethodCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(id)}
      className={[
        'w-full rounded-xl border p-4 text-left transition',
        isSelected
          ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
          : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600',
        className,
      ].join(' ')}
    >
      <div className="flex items-center gap-3">
        {logo ? <img src={logo} alt={name} className="h-10 w-10 rounded object-contain" /> : <div className="h-10 w-10 rounded bg-gray-200 dark:bg-gray-700" />}
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">{name}</p>
          {description ? <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p> : null}
        </div>
      </div>
    </button>
  );
}
