'use client';

import PaymentMethodCard from './PaymentMethodCard';

export interface PaymentMethodOption {
  id: string;
  name: string;
  description?: string;
  logo?: string;
}

interface PaymentMethodSelectorProps {
  methods: PaymentMethodOption[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  className?: string;
}

export default function PaymentMethodSelector({
  methods,
  selectedId,
  onSelect,
  className = '',
}: PaymentMethodSelectorProps) {
  return (
    <div className={['grid grid-cols-1 gap-3 md:grid-cols-2', className].join(' ')}>
      {methods.map((method) => (
        <PaymentMethodCard
          key={method.id}
          id={method.id}
          name={method.name}
          description={method.description}
          logo={method.logo}
          isSelected={selectedId === method.id}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
