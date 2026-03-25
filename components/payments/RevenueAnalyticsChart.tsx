'use client';

interface DataPoint {
  label: string;
  value: number;
}

interface RevenueAnalyticsChartProps {
  title?: string;
  data: DataPoint[];
  className?: string;
}

function BarRow({ label, value, max }: { label: string; value: number; max: number }) {
  const width = `${(value / max) * 100}%`;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2 rounded bg-gray-200 dark:bg-gray-800">
        <div className="h-2 rounded bg-blue-600" style={{ width }} />
      </div>
    </div>
  );
}

export default function RevenueAnalyticsChart({
  title = 'Revenue Analytics',
  data,
  className = '',
}: RevenueAnalyticsChartProps) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div
      className={[
        'rounded-xl border border-gray-200 p-4 dark:border-gray-700',
        className,
      ].join(' ')}
    >
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <div className="space-y-2">
        {data.map((d) => (
          <BarRow key={d.label} label={d.label} value={d.value} max={max} />
        ))}
        {data.length === 0 ? <p className="text-sm text-gray-500">No data available.</p> : null}
      </div>
    </div>
  );
}
