/**
 * CourseStatsCard - Generated via 21st.dev Magic MCP (github.com/21st-dev/magic-mcp)
 *
 * Demonstrates the output of the `21st_magic_component_builder` tool.
 * Prompt used: "/ui create a modern course statistics dashboard card component
 * with enrollment count, completion rate progress bar, active students count,
 * and revenue stats. Use a clean card layout with icons, gradient accents,
 * and subtle animations."
 */

'use client';

import { useState } from 'react';
import {
  Users,
  TrendingUp,
  DollarSign,
  BookOpen,
  ArrowUpRight,
  ArrowDownRight,
  BarChart2,
} from 'lucide-react';

interface CourseStatsCardProps {
  courseName?: string;
  enrollmentCount?: number;
  completionRate?: number;
  activeStudents?: number;
  revenue?: number;
  currency?: string;
  enrollmentChange?: number;
  completionChange?: number;
  activeChange?: number;
  revenueChange?: number;
}

function StatBadge({ change }: { change: number }) {
  const isPositive = change >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full ${
        isPositive
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
          : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
      }`}
    >
      {isPositive ? (
        <ArrowUpRight className="w-3 h-3" />
      ) : (
        <ArrowDownRight className="w-3 h-3" />
      )}
      {Math.abs(change)}%
    </span>
  );
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  );
}

export default function CourseStatsCard({
  courseName = 'Course Overview',
  enrollmentCount = 1284,
  completionRate = 78,
  activeStudents = 892,
  revenue = 15420,
  currency = 'USD',
  enrollmentChange = 12.5,
  completionChange = 5.2,
  activeChange = -2.1,
  revenueChange = 18.3,
}: CourseStatsCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const stats = [
    {
      label: 'Total Enrollments',
      value: enrollmentCount.toLocaleString(),
      change: enrollmentChange,
      icon: <Users className="w-5 h-5" />,
      color: 'bg-blue-500',
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20',
    },
    {
      label: 'Completion Rate',
      value: `${completionRate}%`,
      change: completionChange,
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'bg-emerald-500',
      gradient: 'from-emerald-500 to-emerald-600',
      bgGradient: 'from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20',
      showProgress: true,
      progressValue: completionRate,
    },
    {
      label: 'Active Students',
      value: activeStudents.toLocaleString(),
      change: activeChange,
      icon: <BookOpen className="w-5 h-5" />,
      color: 'bg-violet-500',
      gradient: 'from-violet-500 to-violet-600',
      bgGradient: 'from-violet-50 to-violet-100 dark:from-violet-900/20 dark:to-violet-800/20',
    },
    {
      label: 'Revenue',
      value: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
      }).format(revenue),
      change: revenueChange,
      icon: <DollarSign className="w-5 h-5" />,
      color: 'bg-amber-500',
      gradient: 'from-amber-500 to-amber-600',
      bgGradient: 'from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20',
    },
  ];

  return (
    <div
      className="w-full max-w-4xl mx-auto"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            {courseName}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Real-time course performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">Live</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${stat.bgGradient} border border-gray-200 dark:border-gray-700 p-5 transition-all duration-300 ${
              isHovered ? 'scale-[1.02] shadow-lg' : 'shadow-md'
            }`}
            style={{
              transitionDelay: `${index * 50}ms`,
            }}
          >
            {/* Icon */}
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white shadow-lg mb-4`}
            >
              {stat.icon}
            </div>

            {/* Label */}
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              {stat.label}
            </p>

            {/* Value */}
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {stat.value}
              </span>
              <StatBadge change={stat.change} />
            </div>

            {/* Progress Bar for Completion Rate */}
            {'showProgress' in stat && stat.showProgress && (
              <div className="mt-3">
                <ProgressBar value={stat.progressValue || 0} color={stat.color} />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {stat.progressValue}% of students completed
                </p>
              </div>
            )}

            {/* Decorative gradient overlay */}
            <div
              className={`absolute -bottom-8 -right-8 w-24 h-24 bg-gradient-to-br ${stat.gradient} opacity-10 rounded-full blur-2xl`}
            />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-6 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <p>Last updated: {new Date().toLocaleString()}</p>
        <button className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
          View detailed analytics →
        </button>
      </div>
    </div>
  );
}
