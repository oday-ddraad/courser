'use client';

import { useSession } from 'next-auth/react';
import { redirect, useParams } from 'next/navigation';
import { hasPermission } from '@/lib/auth/permissions';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Mail,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Save,
  Loader2,
  TrendingUp,
  BarChart3,
  FileText,
  Activity,
} from 'lucide-react';


interface EmailSettings {
  dailyLimit: number;
  monthlyLimit: number;
  dailyWarningThreshold: number;
  monthlyWarningThreshold: number;
  dailySent: number;
  monthlySent: number;
  lastDailyReset: Date;
  lastMonthlyReset: Date;
  notifyAdminOnLimit: boolean;
  adminEmail: string;
  defaultFromEmail: string;
  defaultFromName: string;
  emailEnabled: boolean;
  trackOpens: boolean;
  trackClicks: boolean;
}

interface EmailStats {
  period: string;
  summary: {
    total: number;
    sent: number;
    delivered: number;
    opened: number;
    failed: number;
    deliveryRate: number;
    openRate: number;
  };
  limits: {
    dailyLimit: number;
    monthlyLimit: number;
    dailySent: number;
    monthlySent: number;
    dailyRemaining: number;
    monthlyRemaining: number;
  };
  warnings: {
    dailyLimitReached: boolean;
    monthlyLimitReached: boolean;
    dailyWarning: boolean;
    monthlyWarning: boolean;
    dailyPercentage: number;
    monthlyPercentage: number;
  };
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const t = useTranslations('Dashboard.admin');
  const params = useParams();
  const locale = params.locale as string;

  const [settings, setSettings] = useState<EmailSettings | null>(null);
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'email' | 'general'>('email');

  useEffect(() => {
    if (status !== 'loading' && session && session.user.role === 'admin') {
      fetchSettings();
      fetchStats();
    }
  }, [status, session]);

  if (status === 'loading') {
    return <div className="p-6">Loading...</div>;
  }

  if (!session || session.user.role !== 'admin') {
    redirect('/forbidden');
  }

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/email-settings');
      const data = await response.json();
      if (data.success) {
        setSettings(data.data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/email-stats?period=30d');
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const response = await fetch('/api/admin/email-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        alert('Settings saved successfully!');
      } else {
        alert('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleResetCounters = async (type: 'daily' | 'monthly') => {
    if (!confirm(`Are you sure you want to reset ${type} counters?`)) return;

    try {
      const response = await fetch(`/api/admin/email-settings?type=${type}`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchSettings();
        fetchStats();
      } else {
        alert('Failed to reset counters');
      }
    } catch (error) {
      console.error('Error resetting counters:', error);
      alert('Error resetting counters');
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center mb-6">
        <SettingsIcon className="w-8 h-8 text-gray-600 dark:text-gray-400 mr-3" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('settings.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('settings.subtitle')}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-slate-800 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('email')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
            activeTab === 'email'
              ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Mail className="w-4 h-4 inline mr-2" />
          {t('settings.emailSettings')}
        </button>
        <button
          onClick={() => setActiveTab('general')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
            activeTab === 'general'
              ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <SettingsIcon className="w-4 h-4 inline mr-2" />
          {t('settings.generalSettings')}
        </button>
      </div>


      {activeTab === 'email' && (
        <div className="space-y-6">
          {/* Quick Links */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('settings.quickLinks')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href={`/${locale}/dashboard/admin/settings/email-templates`}
                className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
              >
                <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400 mr-4" />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {t('settings.emailTemplates')}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('settings.manageTemplates')}
                  </p>
                </div>
              </Link>

              <Link
                href={`/${locale}/dashboard/admin/settings/email-logs`}
                className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition"
              >
                <Activity className="w-8 h-8 text-green-600 dark:text-green-400 mr-4" />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {t('settings.emailLogs')}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('settings.viewLogs')}
                  </p>
                </div>
              </Link>
            </div>
          </div>

          {/* Email Statistics */}

          {stats && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <BarChart3 className="w-5 h-5 text-blue-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Email Statistics (Last 30 Days)
                </h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.summary.total}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Total Sent</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.summary.deliveryRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Delivery Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {stats.summary.openRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Open Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {stats.summary.failed}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Failed</div>
                </div>
              </div>

              {/* Usage Warnings */}
              {(stats.warnings.dailyWarning || stats.warnings.monthlyWarning ||
                stats.warnings.dailyLimitReached || stats.warnings.monthlyLimitReached) && (
                <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                    <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Usage Warnings
                    </span>
                  </div>
                  <div className="mt-2 space-y-1">
                    {stats.warnings.dailyWarning && (
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        Daily limit: {stats.warnings.dailyPercentage.toFixed(1)}% used
                      </p>
                    )}
                    {stats.warnings.monthlyWarning && (
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        Monthly limit: {stats.warnings.monthlyPercentage.toFixed(1)}% used
                      </p>
                    )}
                    {stats.warnings.dailyLimitReached && (
                      <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                        Daily limit reached!
                      </p>
                    )}
                    {stats.warnings.monthlyLimitReached && (
                      <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                        Monthly limit reached!
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Email Settings Form */}
          {settings && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Email Configuration
                </h2>
                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Settings
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Sending Limits */}
                <div className="space-y-4">
                  <h3 className="text-md font-medium text-gray-900 dark:text-white">
                    Sending Limits
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Daily Limit
                    </label>
                    <input
                      type="number"
                      value={settings.dailyLimit}
                      onChange={(e) => setSettings({
                        ...settings,
                        dailyLimit: parseInt(e.target.value) || 0
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Current: {stats?.limits.dailySent || 0} sent today
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Monthly Limit
                    </label>
                    <input
                      type="number"
                      value={settings.monthlyLimit}
                      onChange={(e) => setSettings({
                        ...settings,
                        monthlyLimit: parseInt(e.target.value) || 0
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Current: {stats?.limits.monthlySent || 0} sent this month
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Daily Warning (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={settings.dailyWarningThreshold}
                        onChange={(e) => setSettings({
                          ...settings,
                          dailyWarningThreshold: parseInt(e.target.value) || 0
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Monthly Warning (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={settings.monthlyWarningThreshold}
                        onChange={(e) => setSettings({
                          ...settings,
                          monthlyWarningThreshold: parseInt(e.target.value) || 0
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Email Configuration */}
                <div className="space-y-4">
                  <h3 className="text-md font-medium text-gray-900 dark:text-white">
                    Email Configuration
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Default From Email
                    </label>
                    <input
                      type="email"
                      value={settings.defaultFromEmail}
                      onChange={(e) => setSettings({
                        ...settings,
                        defaultFromEmail: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Default From Name
                    </label>
                    <input
                      type="text"
                      value={settings.defaultFromName}
                      onChange={(e) => setSettings({
                        ...settings,
                        defaultFromName: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Admin Email (for notifications)
                    </label>
                    <input
                      type="email"
                      value={settings.adminEmail}
                      onChange={(e) => setSettings({
                        ...settings,
                        adminEmail: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Feature Flags */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                  Feature Settings
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.emailEnabled}
                      onChange={(e) => setSettings({
                        ...settings,
                        emailEnabled: e.target.checked
                      })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Email system enabled
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.trackOpens}
                      onChange={(e) => setSettings({
                        ...settings,
                        trackOpens: e.target.checked
                      })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Track email opens
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.trackClicks}
                      onChange={(e) => setSettings({
                        ...settings,
                        trackClicks: e.target.checked
                      })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Track email clicks
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.notifyAdminOnLimit}
                      onChange={(e) => setSettings({
                        ...settings,
                        notifyAdminOnLimit: e.target.checked
                      })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Notify admin on limit warnings
                    </span>
                  </label>
                </div>
              </div>

              {/* Counter Reset */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                  Counter Management
                </h3>

                <div className="flex space-x-4">
                  <button
                    onClick={() => handleResetCounters('daily')}
                    className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset Daily Counter
                  </button>

                  <button
                    onClick={() => handleResetCounters('monthly')}
                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset Monthly Counter
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'general' && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            General Settings
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            General system settings will be implemented here.
          </p>
        </div>
      )}
    </div>
  );
}
