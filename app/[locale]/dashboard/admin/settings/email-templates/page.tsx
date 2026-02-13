'use client';

import { useSession } from 'next-auth/react';
import { redirect, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import {
  Mail,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  CheckCircle,
  XCircle,
  Loader2,
  X,
  Play,
  Beaker,
  Send,
} from 'lucide-react';

interface EmailTemplate {
  _id: string;
  name: string;
  description?: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  variables: string[];
  category: 'notification' | 'marketing' | 'transactional' | 'other';
  isActive: boolean;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Preview Template Modal Component
function PreviewTemplateModal({
  template,
  onClose
}: {
  template: EmailTemplate;
  onClose: () => void;
}) {
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<{ subject: string; htmlContent: string; textContent: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'html' | 'text'>('html');

  useEffect(() => {
    const initialValues: Record<string, string> = {};
    template.variables.forEach(variable => {
      initialValues[variable] = `[${variable}]`;
    });
    setVariableValues(initialValues);
  }, [template]);

  const generatePreview = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/email-templates/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: template._id,
          variables: variableValues,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setPreview(data.data);
      } else {
        alert(data.error || 'Failed to generate preview');
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      alert('Error generating preview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generatePreview();
  }, [variableValues]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Preview: {template.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <h3 className="font-medium text-gray-900 dark:text-white">Sample Values</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter sample values for template variables:
            </p>
            {template.variables.map((variable) => (
              <div key={variable}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {variable}
                </label>
                <input
                  type="text"
                  value={variableValues[variable] || ''}
                  onChange={(e) => setVariableValues({ ...variableValues, [variable]: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white text-sm"
                />
              </div>
            ))}
            {template.variables.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                No variables in this template
              </p>
            )}
          </div>

          <div className="lg:col-span-2 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : preview ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Subject
                  </label>
                  <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <p className="text-sm text-gray-900 dark:text-white">{preview.subject}</p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Content Preview
                    </label>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setActiveTab('html')}
                        className={`px-3 py-1 text-xs rounded ${
                          activeTab === 'html'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        HTML
                      </button>
                      {preview.textContent && (
                        <button
                          onClick={() => setActiveTab('text')}
                          className={`px-3 py-1 text-xs rounded ${
                            activeTab === 'text'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          Text
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {activeTab === 'html' ? (
                    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                      <iframe
                        srcDoc={preview.htmlContent}
                        className="w-full h-96 bg-white"
                        title="HTML Preview"
                      />
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-gray-600">
                      <pre className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap font-mono">
                        {preview.textContent}
                      </pre>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                Failed to load preview
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Test Email Modal Component
function TestEmailModal({
  template,
  onClose
}: {
  template: EmailTemplate;
  onClose: () => void;
}) {
  const [toEmail, setToEmail] = useState('');
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const initialValues: Record<string, string> = {};
    template.variables.forEach(variable => {
      initialValues[variable] = `Sample ${variable}`;
    });
    setVariableValues(initialValues);
  }, [template]);

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toEmail) {
      alert('Please enter a recipient email');
      return;
    }

    setSending(true);
    try {
      const response = await fetch('/api/admin/email-templates/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: template._id,
          to: toEmail,
          variables: variableValues,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setSent(true);
      } else {
        alert(data.error || 'Failed to send test email');
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      alert('Error sending test email');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-2xl w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Send Test Email: {template.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {sent ? (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Test Email Sent!
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The test email has been sent to {toEmail}
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSendTest} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Recipient Email *
              </label>
              <input
                type="email"
                required
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                placeholder="test@example.com"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
              />
            </div>

            {template.variables.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">Variable Values</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {template.variables.map((variable) => (
                    <div key={variable}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {variable}
                      </label>
                      <input
                        type="text"
                        value={variableValues[variable] || ''}
                        onChange={(e) => setVariableValues({ ...variableValues, [variable]: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                Send Test Email
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// A/B Test Modal Component
function ABTestModal({
  template,
  onClose,
  onUpdate
}: {
  template: EmailTemplate;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [abTestConfig, setAbTestConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'A' | 'B'>('A');
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    fetchABTestConfig();
  }, [template._id]);

  const fetchABTestConfig = async () => {
    try {
      const response = await fetch(`/api/admin/email-templates/${template._id}/ab-test`);
      const data = await response.json();
      if (data.success) {
        setAbTestConfig(data.data);
        if (data.data.enabled) {
          fetchResults();
        }
      }
    } catch (error) {
      console.error('Error fetching A/B test config:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async () => {
    try {
      const response = await fetch(`/api/admin/email-templates/${template._id}/ab-test/results`);
      const data = await response.json();
      if (data.success) {
        setResults(data.data);
      }
    } catch (error) {
      console.error('Error fetching A/B test results:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/email-templates/${template._id}/ab-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(abTestConfig),
      });
      const data = await response.json();
      if (data.success) {
        onUpdate();
        alert('A/B test configuration saved successfully');
      } else {
        alert(data.error || 'Failed to save A/B test configuration');
      }
    } catch (error) {
      console.error('Error saving A/B test:', error);
      alert('Error saving A/B test configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleAction = async (action: 'start' | 'pause' | 'resume' | 'complete', winner?: 'A' | 'B') => {
    try {
      const response = await fetch(`/api/admin/email-templates/${template._id}/ab-test`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, winner }),
      });
      const data = await response.json();
      if (data.success) {
        fetchABTestConfig();
        fetchResults();
        alert(`A/B test ${action}ed successfully`);
      } else {
        alert(data.error || `Failed to ${action} A/B test`);
      }
    } catch (error) {
      console.error(`Error ${action}ing A/B test:`, error);
      alert(`Error ${action}ing A/B test`);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">A/B Test: {template.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {!abTestConfig?.enabled ? (
          <div className="text-center py-8">
            <Beaker className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              A/B Testing Not Enabled
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Configure two variants to test which performs better
            </p>
            <button
              onClick={() => setAbTestConfig({
                enabled: true,
                variantA: { subject: template.subject, htmlContent: template.htmlContent, textContent: template.textContent || '' },
                variantB: { subject: template.subject, htmlContent: template.htmlContent, textContent: template.textContent || '' },
                splitPercentage: 50,
                testDuration: 7,
                status: 'draft',
              })}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Enable A/B Testing
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  abTestConfig.status === 'running'
                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                    : abTestConfig.status === 'completed'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                    : abTestConfig.status === 'paused'
                    ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}>
                  Status: {abTestConfig.status.charAt(0).toUpperCase() + abTestConfig.status.slice(1)}
                </span>
                {abTestConfig.winner && (
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                    Winner: Variant {abTestConfig.winner}
                  </span>
                )}
              </div>
              <div className="flex space-x-2">
                {abTestConfig.status === 'draft' && (
                  <button
                    onClick={() => handleAction('start')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    Start Test
                  </button>
                )}
                {abTestConfig.status === 'running' && (
                  <>
                    <button
                      onClick={() => handleAction('pause')}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
                    >
                      Pause
                    </button>
                    <button
                      onClick={() => {
                        const winner = prompt('Select winner (A or B):') as 'A' | 'B';
                        if (winner === 'A' || winner === 'B') {
                          handleAction('complete', winner);
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      End & Select Winner
                    </button>
                  </>
                )}
                {abTestConfig.status === 'paused' && (
                  <button
                    onClick={() => handleAction('resume')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    Resume
                  </button>
                )}
              </div>
            </div>

            {results && abTestConfig.status !== 'draft' && (
              <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-white mb-4">Test Results</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-white dark:bg-slate-800 rounded border border-gray-200 dark:border-gray-600">
                    <h4 className="font-medium text-blue-600 dark:text-blue-400 mb-2">Variant A</h4>
                    <div className="space-y-1 text-sm">
                      <p>Sent: {results.stats.variantA.sent}</p>
                      <p>Opens: {results.stats.variantA.opens} ({results.stats.variantA.openRate}%)</p>
                      <p>Clicks: {results.stats.variantA.clicks} ({results.stats.variantA.clickRate}%)</p>
                    </div>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-800 rounded border border-gray-200 dark:border-gray-600">
                    <h4 className="font-medium text-green-600 dark:text-green-400 mb-2">Variant B</h4>
                    <div className="space-y-1 text-sm">
                      <p>Sent: {results.stats.variantB.sent}</p>
                      <p>Opens: {results.stats.variantB.opens} ({results.stats.variantB.openRate}%)</p>
                      <p>Clicks: {results.stats.variantB.clicks} ({results.stats.variantB.clickRate}%)</p>
                    </div>
                  </div>
                </div>
                {results.suggestedWinner && !abTestConfig.winner && (
                  <p className="mt-3 text-sm text-purple-600 dark:text-purple-400">
                    Suggested winner based on open rate: Variant {results.suggestedWinner}
                  </p>
                )}
              </div>
            )}

            <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab('A')}
                className={`px-4 py-2 font-medium ${
                  activeTab === 'A'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Variant A
              </button>
              <button
                onClick={() => setActiveTab('B')}
                className={`px-4 py-2 font-medium ${
                  activeTab === 'B'
                    ? 'text-green-600 border-b-2 border-green-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Variant B
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={abTestConfig[`variant${activeTab}`]?.subject || ''}
                  onChange={(e) => setAbTestConfig({
                    ...abTestConfig,
                    [`variant${activeTab}`]: {
                      ...abTestConfig[`variant${activeTab}`],
                      subject: e.target.value,
                    },
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  HTML Content
                </label>
                <textarea
                  rows={6}
                  value={abTestConfig[`variant${activeTab}`]?.htmlContent || ''}
                  onChange={(e) => setAbTestConfig({
                    ...abTestConfig,
                    [`variant${activeTab}`]: {
                      ...abTestConfig[`variant${activeTab}`],
                      htmlContent: e.target.value,
                    },
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Text Content (optional)
                </label>
                <textarea
                  rows={3}
                  value={abTestConfig[`variant${activeTab}`]?.textContent || ''}
                  onChange={(e) => setAbTestConfig({
                    ...abTestConfig,
                    [`variant${activeTab}`]: {
                      ...abTestConfig[`variant${activeTab}`],
                      textContent: e.target.value,
                    },
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white font-mono text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Split Percentage for Variant A
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={abTestConfig.splitPercentage}
                  onChange={(e) => setAbTestConfig({ ...abTestConfig, splitPercentage: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                />
                <p className="text-xs text-gray-500 mt-1">Variant B will receive {100 - (abTestConfig.splitPercentage || 50)}%</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Test Duration (days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={abTestConfig.testDuration}
                  onChange={(e) => setAbTestConfig({ ...abTestConfig, testDuration: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save Configuration
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Template Modal Component
function TemplateModal({
  template,
  onClose,
  onSave
}: {
  template: EmailTemplate | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    description: template?.description || '',
    subject: template?.subject || '',
    htmlContent: template?.htmlContent || '',
    textContent: template?.textContent || '',
    variables: template?.variables.join(', ') || '',
    category: template?.category || 'other',
    isActive: template?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const variables = formData.variables
        .split(',')
        .map(v => v.trim())
        .filter(v => v.length > 0);

      const data = {
        ...formData,
        variables,
      };

      const response = await fetch(
        template
          ? `/api/admin/email-templates/${template._id}`
          : '/api/admin/email-templates',
        {
          method: template ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );

      if (response.ok) {
        onSave();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save template');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Error saving template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">
            {template ? 'Edit Template' : 'Create Template'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Template Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
              >
                <option value="notification">Notification</option>
                <option value="marketing">Marketing</option>
                <option value="transactional">Transactional</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subject Line *
            </label>
            <input
              type="text"
              required
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Variables (comma-separated, e.g., name, courseName, date)
            </label>
            <input
              type="text"
              value={formData.variables}
              onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
              placeholder="name, courseName, date"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              HTML Content *
            </label>
            <textarea
              required
              rows={8}
              value={formData.htmlContent}
              onChange={(e) => setFormData({ ...formData, htmlContent: e.target.value })}
              placeholder="Use {{variable}} for dynamic content"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Text Content (optional)
            </label>
            <textarea
              rows={4}
              value={formData.textContent}
              onChange={(e) => setFormData({ ...formData, textContent: e.target.value })}
              placeholder="Plain text version"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white font-mono text-sm"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Template is active
            </label>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {template ? 'Update' : 'Create'} Template
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// View Template Modal Component
function ViewTemplateModal({
  template,
  onClose
}: {
  template: EmailTemplate;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">View Template: {template.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 capitalize">
                {template.category}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                template.isActive
                  ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                  : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
              }`}>
                {template.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          {template.description && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <p className="text-sm text-gray-900 dark:text-white">
                {template.description}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subject
            </label>
            <p className="text-sm text-gray-900 dark:text-white">
              {template.subject}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Variables
            </label>
            <div className="flex flex-wrap gap-2">
              {template.variables.map((variable, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs font-medium rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                >
                  {variable}
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              HTML Content
            </label>
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-slate-700">
              <pre className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap font-mono">
                {template.htmlContent}
              </pre>
            </div>
          </div>

          {template.textContent && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Text Content
              </label>
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-slate-700">
                <pre className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap font-mono">
                  {template.textContent}
                </pre>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Created By
              </label>
              <p className="text-sm text-gray-900 dark:text-white">
                {template.createdBy.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {template.createdBy.email}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Created At
              </label>
              <p className="text-sm text-gray-900 dark:text-white">
                {new Date(template.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Email Templates Page Component
export default function EmailTemplatesPage() {
  const { data: session, status } = useSession();
  const t = useTranslations('Dashboard.admin');
  const params = useParams();
  const locale = params.locale as string;

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showABTestModal, setShowABTestModal] = useState(false);

  useEffect(() => {
    if (status !== 'loading' && session && session.user.role === 'admin') {
      fetchTemplates();
    }
  }, [status, session]);

  if (status === 'loading') {
    return <div className="p-6">Loading...</div>;
  }

  if (!session || session.user.role !== 'admin') {
    redirect('/forbidden');
  }

  const fetchTemplates = async () => {
    try {
      const params = new URLSearchParams();
      if (categoryFilter) params.append('category', categoryFilter);
      if (statusFilter) params.append('isActive', statusFilter === 'active' ? 'true' : 'false');

      const response = await fetch(`/api/admin/email-templates?${params}`);
      const data = await response.json();
      if (data.success) {
        setTemplates(data.data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await fetch(`/api/admin/email-templates/${templateId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchTemplates();
      } else {
        alert('Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Error deleting template');
    }
  };

  const handleToggleActive = async (templateId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/email-templates/${templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        fetchTemplates();
      } else {
        alert('Failed to update template status');
      }
    } catch (error) {
      console.error('Error updating template:', error);
      alert('Error updating template');
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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('settings.emailTemplates')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('settings.emailTemplatesSubtitle')}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('settings.createTemplate')}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder={t('settings.searchTemplates')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
              />
            </div>
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          >
            <option value="">{t('settings.allCategories')}</option>
            <option value="notification">{t('settings.notification')}</option>
            <option value="marketing">{t('settings.marketing')}</option>
            <option value="transactional">{t('settings.transactional')}</option>
            <option value="other">{t('settings.other')}</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          >
            <option value="">{t('settings.allStatus')}</option>
            <option value="active">{t('settings.active')}</option>
            <option value="inactive">{t('settings.inactive')}</option>
          </select>
        </div>
      </div>

      {/* Templates Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('settings.template')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('settings.category')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('settings.status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('settings.variables')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('settings.created')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('settings.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTemplates.map((template) => (
                <tr key={template._id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {template.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                        {template.subject}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 capitalize">
                      {template.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleActive(template._id, template.isActive)}
                      className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                        template.isActive
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                      }`}
                    >
                      {template.isActive ? (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {t('settings.active')}
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 mr-1" />
                          {t('settings.inactive')}
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {template.variables.length} {t('settings.variables')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(template.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedTemplate(template);
                          setShowPreviewModal(true);
                        }}
                        className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                        title={t('settings.preview') || 'Preview'}
                      >
                        <Play className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedTemplate(template);
                          setShowTestModal(true);
                        }}
                        className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300"
                        title={t('settings.testEmail') || 'Send Test'}
                      >
                        <Send className="w-4 h-4" />
                      </button>
                      {template.category === 'marketing' && (
                        <button
                          onClick={() => {
                            setSelectedTemplate(template);
                            setShowABTestModal(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          title={t('settings.abTest') || 'A/B Test'}
                        >
                          <Beaker className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedTemplate(template);
                          setShowViewModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        title={t('settings.view')}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedTemplate(template);
                          setShowEditModal(true);
                        }}
                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                        title={t('settings.edit')}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template._id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        title={t('settings.delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {t('settings.noTemplates')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || categoryFilter || statusFilter
                ? t('settings.adjustFilters')
                : t('settings.createFirstTemplate')
              }
            </p>
            {!searchTerm && !categoryFilter && !statusFilter && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('settings.createTemplate')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Template Modal */}
      {(showCreateModal || showEditModal) && (
        <TemplateModal
          template={showEditModal ? selectedTemplate : null}
          onClose={() => {
            setShowCreateModal(false);
            setShowEditModal(false);
            setSelectedTemplate(null);
          }}
          onSave={() => {
            setShowCreateModal(false);
            setShowEditModal(false);
            setSelectedTemplate(null);
            fetchTemplates();
          }}
        />
      )}

      {/* View Template Modal */}
      {showViewModal && selectedTemplate && (
        <ViewTemplateModal
          template={selectedTemplate}
          onClose={() => {
            setShowViewModal(false);
            setSelectedTemplate(null);
          }}
        />
      )}

      {/* Preview Template Modal */}
      {showPreviewModal && selectedTemplate && (
        <PreviewTemplateModal
          template={selectedTemplate}
          onClose={() => {
            setShowPreviewModal(false);
            setSelectedTemplate(null);
          }}
        />
      )}

      {/* Test Email Modal */}
      {showTestModal && selectedTemplate && (
        <TestEmailModal
          template={selectedTemplate}
          onClose={() => {
            setShowTestModal(false);
            setSelectedTemplate(null);
          }}
        />
      )}

      {/* A/B Test Modal */}
      {showABTestModal && selectedTemplate && (
        <ABTestModal
          template={selectedTemplate}
          onClose={() => {
            setShowABTestModal(false);
            setSelectedTemplate(null);
          }}
          onUpdate={() => fetchTemplates()}
        />
      )}
    </div>
  );
}
