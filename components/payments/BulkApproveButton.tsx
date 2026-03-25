'use client';

interface BulkApproveButtonProps {
  selectedCount: number;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function BulkApproveButton({
  selectedCount,
  disabled = false,
  onClick,
  className = '',
}: BulkApproveButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || selectedCount === 0}
      onClick={onClick}
      className={[
        'rounded bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      ].join(' ')}
    >
      Approve Selected ({selectedCount})
    </button>
  );
}
