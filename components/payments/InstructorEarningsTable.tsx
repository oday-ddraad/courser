'use client';

import { useTranslations } from 'next-intl';

export interface InstructorEarningsRow {

  courseId: string;
  courseName: string;
  students: number;
  revenue: number;
  currency: string;
}

interface InstructorEarningsTableProps {
  rows: InstructorEarningsRow[];
  className?: string;
}

export default function InstructorEarningsTable({ rows, className = '' }: InstructorEarningsTableProps) {
  const t = useTranslations('Payment');
  const tt = (key: string, fallback: string) => (t.has(key) ? t(key) : fallback);

  return (

    <div className={['overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700', className].join(' ')}>
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-900/40">
          <tr>
            <th className="px-3 py-2 text-left">{tt('instructor.course', 'Course')}</th>
            <th className="px-3 py-2 text-left">{tt('instructor.students', 'Students')}</th>
            <th className="px-3 py-2 text-left">{tt('instructor.revenue', 'Revenue')}</th>

          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.courseId} className="border-t border-gray-100 dark:border-gray-800">
              <td className="px-3 py-2">{row.courseName}</td>
              <td className="px-3 py-2">{row.students}</td>
              <td className="px-3 py-2">{row.revenue} {row.currency}</td>
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-3 py-6 text-center text-gray-500">
                {tt('instructor.empty', 'No earnings data')}
              </td>

            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
