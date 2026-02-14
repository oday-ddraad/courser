'use client';

import { useSession } from 'next-auth/react';
import { redirect, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Mail,
  MessageCircle,
  AlertTriangle,
  RefreshCw,
  Save,
  Loader2,
  BarChart3,
  FileText,
  Activity,
} from 'lucide-react';

interface EmailSettings {
  dailyLimit: number;
  monthlyLimit: number;
  dailyWarningThreshold: number;
  monthlyWarningThreshold: number;
  notifyAdminOnLimit: boolean;
  adminEmail: string;
  defaultFromEmail: string;
  defaultFromName: string;
  emailEnabled: boolean;
  trackOpens: boolean;
  trackClicks: boolean;
}

interface EmailStats {
  summary: {
    total: number;
    sent: number;
    deliveryRate: number;
    openRate: number;
    failed: number;
  };
  limits: {
    dailyLimit: number;
    monthlyLimit: number;
    dailySent: number;
    monthlySent: number;
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

interface WhatsAppSettingsData {
  enabled: boolean;
  otpEnabled: boolean;
  notificationsEnabled: boolean;
  monthlyLimit: number;
  warningThreshold: number;
  monthlyConversations: number;
  totalConversations: number;
  activeConversations: number;
  adminEmail: string;
  notifyAdminOnLimit: boolean;
}


interface WhatsAppStats {
  usagePercentage: number;
  remainingConversations: number;
  warningTriggered: boolean;
  limitReached: boolean;
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const t = useTranslations('Dashboard.admin');
  const params = useParams();
  const locale = params.locale as string;

  const [emailSettings, setEmailSettings] = useState<EmailSettings | null>(null);
  const [emailStats, setEmailStats] = useState<EmailStats | null>(null);
  const [whatsappSettings, setWhatsappSettings] = useState<WhatsAppSettingsData | null>(null);
  const [whatsappStats, setWhatsappStats] = useState<WhatsAppStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'email' | 'whatsapp' | 'general'>('email');

  useEffect(() => {
    if (status !== 'loading' && session && session.user.role === 'admin') {
      fetchEmailSettings();
      fetchEmailStats();
      fetchWhatsappSettings();
    }
  }, [status, session]);

  if (status === 'loading') {
    return <div className="p-6">Loading...</div>;
  }

  if (!session || session.user.role !== 'admin') {
    redirect('/forbidden');
  }

  const fetchEmailSettings = async () => {
    try {
      const response = await fetch('/api/admin/email-settings');
      const data = await response.json();
      if (data.success) {
        setEmailSettings(data.data);
      }
    } catch (error) {
      console.error('Error fetching email settings:', error);
    }
  };

  const fetchEmailStats = async () => {
    try {
      const response = await fetch('/api/admin/email-stats?period=30d');
      const data = await response.json();
      if (data.success) {
        setEmailStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching email stats:', error);
    }
  };

  const fetchWhatsappSettings = async () => {
    try {
      const response = await fetch('/api/admin/whatsapp-settings');
      const data = await response.json();
      if (data.success) {
        // Ensure all boolean fields have default values
        setWhatsappSettings({
          enabled: data.data.settings.enabled ?? true,
          otpEnabled: data.data.settings.otpEnabled ?? true,
          notificationsEnabled: data.data.settings.notificationsEnabled ?? true,
          monthlyLimit: data.data.settings.monthlyLimit,
          warningThreshold: data.data.settings.warningThreshold,
          monthlyConversations: data.data.settings.monthlyConversations,
          totalConversations: data.data.settings.totalConversations,
          activeConversations: data.data.settings.activeConversations,
          adminEmail: data.data.settings.adminEmail,
          notifyAdminOnLimit: data.data.settings.notifyAdminOnLimit,
        });
        setWhatsappStats(data.data.stats);
      }
    } catch (error) {
      console.error('Error fetching WhatsApp settings:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleSaveEmailSettings = async () => {
    if (!emailSettings) return;
    setSaving(true);
    try {
      const response = await fetch('/api/admin/email-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailSettings),
      });
      if (response.ok) {
        alert('Email settings saved successfully!');
      } else {
        alert('Failed to save email settings');
      }
    } catch (error) {
      console.error('Error saving email settings:', error);
      alert('Error saving email settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWhatsappSettings = async () => {
    if (!whatsappSettings) return;
    setSaving(true);
    try {
      const response = await fetch('/api/admin/whatsapp-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: whatsappSettings.enabled,
          otpEnabled: whatsappSettings.otpEnabled,
          notificationsEnabled: whatsappSettings.notificationsEnabled,
          monthlyLimit: whatsappSettings.monthlyLimit,
          warningThreshold: whatsappSettings.warningThreshold,
          adminEmail: whatsappSettings.adminEmail,
          notifyAdminOnLimit: whatsappSettings.notifyAdminOnLimit,
        }),
      });

      if (response.ok) {
        alert(t('settings.whatsappSettingsSaved'));
        fetchWhatsappSettings();
      } else {
        alert(t('settings.whatsappSettingsSaveFailed'));
      }
    } catch (error) {
      console.error('Error saving WhatsApp settings:', error);
      alert(t('settings.whatsappSettingsSaveFailed'));

    } finally {
      setSaving(false);
    }
  };

  const handleResetEmailCounters = async (type: 'daily' | 'monthly') => {
    if (!confirm(`Are you sure you want to reset ${type} counters?`)) return;
    try {
      const response = await fetch(`/api/admin/email-settings?type=${type}`, {
        method: 'POST',
      });
      if (response.ok) {
        fetchEmailSettings();
        fetchEmailStats();
      } else {
        alert('Failed to reset counters');
      }
    } catch (error) {
      console.error('Error resetting counters:', error);
    }
  };

  const handleResetWhatsappCounters = async () => {
    if (!confirm(t('settings.confirmReset', { type: 'monthly' }))) return;
    try {
      const response = await fetch('/api/admin/whatsapp-settings?type=monthly', {
        method: 'POST',
      });
      if (response.ok) {
        fetchWhatsappSettings();
        alert(t('settings.countersReset'));
      } else {
        alert(t('settings.countersResetFailed'));
      }
    } catch (error) {
      console.error('Error resetting WhatsApp counters:', error);
      alert(t('settings.countersResetFailed'));
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
          onClick={() => setActiveTab('whatsapp')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
            activeTab === 'whatsapp'
              ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <MessageCircle className="w-4 h-4 inline mr-2" />
          {t('settings.whatsappSettings')}
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

      {activeTab === 'email' && emailSettings && (
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

          {/* Email Stats */}
          {emailStats && (
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
                    {emailStats.summary.total}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Total Sent</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {emailStats.summary.deliveryRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Delivery Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {emailStats.summary.openRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Open Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {emailStats.summary.failed}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Failed</div>
                </div>
              </div>
              {(emailStats.warnings.dailyWarning || emailStats.warnings.monthlyWarning) && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                    <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Usage Warnings
                    </span>
                  </div>
                  <div className="mt-2 space-y-1">
                    {emailStats.warnings.dailyWarning && (
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        Daily: {emailStats.warnings.dailyPercentage.toFixed(1)}% used
                      </p>
                    )}
                    {emailStats.warnings.monthlyWarning && (
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        Monthly: {emailStats.warnings.monthlyPercentage.toFixed(1)}% used
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Email Settings Form */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Email Configuration
              </h2>
              <button
                onClick={handleSaveEmailSettings}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Settings
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-md font-medium text-gray-900 dark:text-white">Sending Limits</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Daily Limit</label>
                  <input
                    type="number"
                    value={emailSettings.dailyLimit}
                    onChange={(e) => setEmailSettings({ ...emailSettings, dailyLimit: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monthly Limit</label>
                  <input
                    type="number"
                    value={emailSettings.monthlyLimit}
                    onChange={(e) => setEmailSettings({ ...emailSettings, monthlyLimit: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-md font-medium text-gray-900 dark:text-white">Configuration</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default From Email</label>
                  <input
                    type="email"
                    value={emailSettings.defaultFromEmail}
                    onChange={(e) => setEmailSettings({ ...emailSettings, defaultFromEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Admin Email</label>
                  <input
                    type="email"
                    value={emailSettings.adminEmail}
                    onChange={(e) => setEmailSettings({ ...emailSettings, adminEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">Counter Management</h3>
              <div className="flex space-x-4">
                <button
                  onClick={() => handleResetEmailCounters('daily')}
                  className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
                >
                  <RefreshCw className="w-4 h-4 mr-2" /> Reset Daily
                </button>
                <button
                  onClick={() => handleResetEmailCounters('monthly')}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  <RefreshCw className="w-4 h-4 mr-2" /> Reset Monthly
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'whatsapp' && whatsappSettings && whatsappStats && (
        <div className="space-y-6">
          {/* Master Toggle Banner */}
          <div className={`p-4 rounded-lg border ${
            whatsappSettings.enabled
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`p-2 rounded-full mr-3 ${
                  whatsappSettings.enabled ? 'bg-green-100 dark:bg-green-800' : 'bg-gray-200 dark:bg-gray-700'
                }`}>
                  <MessageCircle className={`w-5 h-5 ${
                    whatsappSettings.enabled ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
                  }`} />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {t('settings.whatsappIntegration')}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {whatsappSettings.enabled 
                      ? t('settings.whatsappEnabled')
                      : t('settings.whatsappDisabled')}
                  </p>
                </div>

              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={whatsappSettings.enabled}
                  onChange={(e) => setWhatsappSettings({
                    ...whatsappSettings,
                    enabled: e.target.checked
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
              </label>
            </div>
          </div>

          {/* WhatsApp Statistics */}

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <MessageCircle className="w-5 h-5 text-green-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('settings.conversationTracking')}
              </h2>
            </div>


            {/* Usage Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-700 dark:text-gray-300">{t('settings.monthlyUsage')}</span>
                <span className="text-gray-700 dark:text-gray-300">
                  {whatsappSettings.monthlyConversations} / {whatsappSettings.monthlyLimit} {t('settings.conversations')}
                </span>
              </div>

              <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-4">
                <div
                  className={`h-4 rounded-full transition-all ${
                    whatsappStats.limitReached
                      ? 'bg-red-600'
                      : whatsappStats.warningTriggered
                      ? 'bg-yellow-500'
                      : 'bg-green-600'
                  }`}
                  style={{ width: `${Math.min(whatsappStats.usagePercentage, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs mt-1 text-gray-500 dark:text-gray-400">
                <span>0%</span>
                <span>{whatsappSettings.warningThreshold}% warning</span>

                <span>100%</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {whatsappSettings.monthlyConversations}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{t('settings.thisMonth')}</div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {whatsappStats.remainingConversations}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{t('settings.remaining')}</div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {whatsappSettings.activeConversations}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{t('settings.active24h')}</div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {whatsappSettings.totalConversations}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{t('settings.totalEver')}</div>
              </div>
            </div>


            {/* Warning Banner */}
            {(whatsappStats.warningTriggered || whatsappStats.limitReached) && (
              <div className={`p-4 rounded-lg mb-6 ${
                whatsappStats.limitReached
                  ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                  : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
              }`}>
                <div className="flex items-center">
                  <AlertTriangle className={`w-5 h-5 mr-2 ${
                    whatsappStats.limitReached ? 'text-red-600' : 'text-yellow-600'
                  }`} />
                  <span className={`text-sm font-medium ${
                    whatsappStats.limitReached
                      ? 'text-red-800 dark:text-red-200'
                      : 'text-yellow-800 dark:text-yellow-200'
                  }`}>
                    {whatsappStats.limitReached
                      ? t('settings.limitReached')
                      : t('settings.usageWarning', { percentage: whatsappStats.usagePercentage.toFixed(1) })
                    }
                  </span>

                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">{t('settings.howConversationsWork')}</h4>
              <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                <li>• {t('settings.conversationExplanation1')}</li>
                <li>• {t('settings.conversationExplanation2')}</li>
                <li>• {t('settings.conversationExplanation3')}</li>
                <li>• {t('settings.conversationExplanation4')}</li>
              </ul>
            </div>

          </div>

          {/* WhatsApp Settings Form */}
          <div className={`bg-white dark:bg-slate-800 rounded-lg shadow p-6 ${
            !whatsappSettings.enabled ? 'opacity-50 pointer-events-none' : ''
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('settings.whatsappConfiguration')}
              </h2>

              <button
                onClick={handleSaveWhatsappSettings}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {t('settings.saveSettings')}
              </button>
            </div>


            {/* Feature Toggles */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
              <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">{t('settings.featureToggles')}</h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('settings.otpVerification')}</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('settings.otpDescription')}</p>
                  </div>

                  <input
                    type="checkbox"
                    checked={whatsappSettings.otpEnabled}
                    disabled={!whatsappSettings.enabled}
                    onChange={(e) => setWhatsappSettings({
                      ...whatsappSettings,
                      otpEnabled: e.target.checked
                    })}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 disabled:opacity-50"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('settings.whatsappNotifications')}</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('settings.notificationsDescription')}</p>
                  </div>

                  <input
                    type="checkbox"
                    checked={whatsappSettings.notificationsEnabled}
                    disabled={!whatsappSettings.enabled}
                    onChange={(e) => setWhatsappSettings({
                      ...whatsappSettings,
                      notificationsEnabled: e.target.checked
                    })}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 disabled:opacity-50"
                  />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-md font-medium text-gray-900 dark:text-white">{t('settings.sendingLimits')}</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('settings.monthlyConversationLimit')}
                  </label>
                  <input
                    type="number"
                    value={whatsappSettings.monthlyLimit}
                    onChange={(e) => setWhatsappSettings({
                      ...whatsappSettings,
                      monthlyLimit: parseInt(e.target.value) || 0
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-slate-700 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('settings.limitDefault')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('settings.warningThreshold')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={whatsappSettings.warningThreshold}
                    onChange={(e) => setWhatsappSettings({
                      ...whatsappSettings,
                      warningThreshold: parseInt(e.target.value) || 0
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-slate-700 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('settings.thresholdDefault')}
                  </p>
                </div>
              </div>


              <div className="space-y-4">
                <h3 className="text-md font-medium text-gray-900 dark:text-white">{t('settings.notifications')}</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('settings.adminEmail')}
                  </label>

                  <input
                    type="email"
                    value={whatsappSettings.adminEmail}
                    onChange={(e) => setWhatsappSettings({
                      ...whatsappSettings,
                      adminEmail: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-slate-700 dark:text-white"
                  />
                </div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={whatsappSettings.notifyAdminOnLimit}
                    onChange={(e) => setWhatsappSettings({
                      ...whatsappSettings,
                      notifyAdminOnLimit: e.target.checked
                    })}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    {t('settings.notifyAdminOnLimit')}
                  </span>

                </label>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">{t('settings.counterManagement')}</h3>
              <button
                onClick={handleResetWhatsappCounters}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {t('settings.resetMonthlyCounter')}
              </button>
            </div>

          </div>
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
