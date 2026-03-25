'use client';

import { useEffect, useMemo, useState } from 'react';
import InstructorEarningsCard from '@/components/payments/InstructorEarningsCard';
import InstructorEarningsTable from '@/components/payments/InstructorEarningsTable';
import PayoutHistoryTable from '@/components/payments/PayoutHistoryTable';

interface EarningsByCourseRow {
  courseId: string;
  courseName: string;
  students: number;
  revenue: number;
  currency: string;
}

interface PayoutRow {
  id: string;
  amount: number;
  currency: string;
  paidAt: string;
  note?: string;
  reference?: string;
}

interface InstructorRecord {
  instructorId: string;
  instructorName: string;
  totalRevenue: number;
  totalPaid: number;
  pendingPayout: number;
  currency: string;
  byCourse: EarningsByCourseRow[];
  payouts: PayoutRow[];
}

interface ApiResponse {
  success?: boolean;
  data?: InstructorRecord[];
}

export default function AdminInstructorPaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<InstructorRecord[]>([]);
  const [selectedInstructorId, setSelectedInstructorId] = useState<string>('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/instructor-earnings', { cache: 'no-store' });
      const json: ApiResponse = await res.json();
      if (res.ok && json?.success) {
        setRows(json.data || []);
        if (!selectedInstructorId && (json.data || []).length > 0) {
          setSelectedInstructorId((json.data || [])[0].instructorId);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const selected = useMemo(
    () => rows.find((r) => r.instructorId === selectedInstructorId) || rows[0],
    [rows, selectedInstructorId]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Instructor Earnings Management</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Review instructor revenue, payout history, and pending amounts.
        </p>
      </div>

      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-5 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
          Loading instructor earnings...
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-5 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
          No instructor earnings found.
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
            <label className="mb-2 block text-sm font-medium">Select Instructor</label>
            <select
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
              value={selected?.instructorId || ''}
              onChange={(e) => setSelectedInstructorId(e.target.value)}
            >
              {rows.map((r) => (
                <option key={r.instructorId} value={r.instructorId}>
                  {r.instructorName}
                </option>
              ))}
            </select>
          </div>

          {selected ? (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <InstructorEarningsCard
                  title="Total Revenue"
                  value={`${selected.totalRevenue} ${selected.currency}`}
                />
                <InstructorEarningsCard
                  title="Total Paid"
                  value={`${selected.totalPaid} ${selected.currency}`}
                />
                <InstructorEarningsCard
                  title="Pending Payout"
                  value={`${selected.pendingPayout} ${selected.currency}`}
                />
              </div>

              <div className="space-y-2">
                <h2 className="text-lg font-semibold">Revenue by Course</h2>
                <InstructorEarningsTable rows={selected.byCourse || []} />
              </div>

              <div className="space-y-2">
                <h2 className="text-lg font-semibold">Payout History</h2>
                <PayoutHistoryTable rows={selected.payouts || []} />
              </div>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
