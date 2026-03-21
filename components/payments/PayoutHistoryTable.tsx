'use client';

export interface PayoutHistoryRow {
  id: string;
  amount: number;
  currency: string;
  paidAt: string | Date;
  note?: string;
  reference?: string;
}

interface PayoutHistoryTableProps {
  rows: PayoutHistoryRow[];
  className?: string;
}

export default function PayoutHistoryTable({ rows, className = '' }: PayoutHistoryTableProps) {
  return (
    <div className={['overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700', className].join(' ')}>
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-900/40">
          <tr>
            <th className="px-3 py-2 text-left">Amount</th>
            <th className="px-3 py-2 text-left">Paid At</th>
            <th className="px-3 py-2 text-left">Reference</th>
            <th className="px-3 py-2 text-left">Note</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-gray-100 dark:border-gray-800">
              <td className="px-3 py-2">{row.amount} {row.currency}</td>
              <td className="px-3 py-2">{new Date(row.paidAt).toLocaleString()}</td>
              <td className="px-3 py-2">{row.reference || '-'}</td>
              <td className="px-3 py-2">{row.note || '-'}</td>
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-3 py-6 text-center text-gray-500">No payouts yet</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
