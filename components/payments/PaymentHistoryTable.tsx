'use client';

import PaymentStatusBadge from './PaymentStatusBadge';
import type { PaymentStatus } from '@/types/database';
import { useTranslations } from 'next-intl';


export interface PaymentHistoryRow {
  id: string;
  courseName: string;
  amount: number;
  currency: string;
  methodName: string;
  status: PaymentStatus;
  submittedAt: string | Date;
}

interface PaymentHistoryTableProps {
  rows: PaymentHistoryRow[];
  onView?: (id: string) => void;
  onResubmit?: (id: string) => void;
  className?: string;
}

export default function PaymentHistoryTable({
  rows,
  onView,
  onResubmit,
  className = '',
}: PaymentHistoryTableProps) {
  const t = useTranslations('Payment');
  const tt = (key: string, fallback: string) => (t.has(key) ? t(key) : fallback);

  return (

    <div className={['overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700', className].join(' ')}>
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-900/40">
          <tr>
            <th className="px-3 py-2 text-left">{tt('history.course', 'Course')}</th>
            <th className="px-3 py-2 text-left">{tt('history.amount', 'Amount')}</th>
            <th className="px-3 py-2 text-left">{tt('history.method', 'Method')}</th>
            <th className="px-3 py-2 text-left">{tt('history.status', 'Status')}</th>
            <th className="px-3 py-2 text-left">{tt('history.submitted', 'Submitted')}</th>
            <th className="px-3 py-2 text-left">{tt('history.actions', 'Actions')}</th>

          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-gray-100 dark:border-gray-800">
              <td className="px-3 py-2">{row.courseName}</td>
              <td className="px-3 py-2">{row.amount} {row.currency}</td>
              <td className="px-3 py-2">{row.methodName}</td>
              <td className="px-3 py-2"><PaymentStatusBadge status={row.status} /></td>
              <td className="px-3 py-2">{new Date(row.submittedAt).toLocaleString()}</td>
              <td className="px-3 py-2">
                <div className="flex gap-2">
                  <button type="button" onClick={() => onView?.(row.id)} className="rounded border px-2 py-1 text-xs">
                    {tt('history.view', 'View')}
                  </button>
                  {row.status === 'rejected' ? (
                    <button type="button" onClick={() => onResubmit?.(row.id)} className="rounded border px-2 py-1 text-xs">
                      {tt('history.resubmit', 'Resubmit')}
                    </button>
                  ) : null}

                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-3 py-6 text-center text-gray-500">
                {tt('history.empty', 'No payments found')}
              </td>

            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
