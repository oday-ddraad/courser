'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Send, Bell, CheckCircle, User } from 'lucide-react';



interface User {
  _id: string;
  name: string;
  email: string;
}

interface PusherTestFormProps {
  users: User[];
  currentUserId: string;
  locale: string;
}

export default function PusherTestForm({ users, currentUserId, locale }: PusherTestFormProps) {
  const t = useTranslations('admin');

  const [selectedUserId, setSelectedUserId] = useState(currentUserId);
  const [notificationType, setNotificationType] = useState('test_notification');
  const [customTitle, setCustomTitle] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendRealtime, setSendRealtime] = useState(true);
  void locale;



  const notificationTypes = [
    { value: 'test_notification', label: t('testNotificationType') },
    { value: 'payment_approved', label: t('paymentApproved') },
    { value: 'course_enrolled', label: t('courseEnrolled') },
    { value: 'admin_message', label: t('adminMessage') },
    { value: 'custom', label: t('customNotification') },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);

    try {
      console.log('[DEBUG] Sending Pusher test notification...');

      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUserId,
          type: notificationType,
          title: customTitle || getDefaultTitle(),
          message: customMessage || getDefaultMessage(),
          sendRealtime,
          data: {
            test: true,
            timestamp: new Date().toISOString(),
            sentBy: currentUserId,
          },
        }),
      });

      const result = await response.json();
      console.log('[DEBUG] API response:', result);

      if (response.ok) {
        alert(t('notificationSentSuccessfully'));


        // Log the expected Pusher event
        console.log('[DEBUG] Expected Pusher event:', {
          channel: `private-user-${selectedUserId}`,
          event: 'new-notification',
          data: {
            notificationId: result.data?._id,
            type: notificationType,
            title: customTitle || getDefaultTitle(),
            message: customMessage || getDefaultMessage(),
          }
        });
      } else {
        alert(result.error || t('failedToSendNotification'));

        console.error('[DEBUG] Failed to send notification:', result.error);
      }
    } catch (error) {
      console.error('[DEBUG] Error sending notification:', error);
      alert(error instanceof Error ? error.message : t('unknownError'));

    } finally {
      setIsSending(false);
    }
  };

  const getDefaultTitle = () => {
    switch (notificationType) {
      case 'test_notification': return t('testNotificationTitle');
      case 'payment_approved': return t('paymentApprovedTitle');
      case 'course_enrolled': return t('courseEnrolledTitle');
      case 'admin_message': return t('adminMessageTitle');
      default: return t('notificationTitle');
    }
  };

  const getDefaultMessage = () => {
    switch (notificationType) {
      case 'test_notification': return t('testNotificationMessage');
      case 'payment_approved': return t('paymentApprovedMessage');
      case 'course_enrolled': return t('courseEnrolledMessage');
      case 'admin_message': return t('adminMessageMessage');
      default: return t('notificationMessage');
    }
  };

  const selectedUser = users.find(user => user._id === selectedUserId);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* User Selection */}
      <div>
        <label htmlFor="userId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('selectUser')}
        </label>
        <select
          id="userId"
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        >
          <option value="">{t('selectUserPlaceholder')}</option>
          {users.map((user) => (
            <option key={user._id} value={user._id}>
              {user.name} ({user.email})
            </option>
          ))}
        </select>
        {selectedUser && (
          <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {t('selectedUser')}: {selectedUser.name} ({selectedUser.email})
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Notification Type */}
      <div>
        <label htmlFor="notificationType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('notificationType')}
        </label>
        <select
          id="notificationType"
          value={notificationType}
          onChange={(e) => setNotificationType(e.target.value)}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {notificationTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Custom Content (shown for custom type) */}
      {notificationType === 'custom' && (
        <div className="space-y-4">
          <div>
            <label htmlFor="customTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('customTitle')}
            </label>
            <input
              id="customTitle"
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder={t('customTitlePlaceholder')}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="customMessage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('customMessage')}
            </label>
            <textarea
              id="customMessage"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder={t('customMessagePlaceholder')}
              rows={3}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>
      )}

      {/* Notification Preview */}
      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">
          {t('notificationPreview')}
        </h3>
        <div className="space-y-2">
          <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Bell className="w-5 h-5 text-blue-600 dark:text-blue-300" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white">
                {customTitle || getDefaultTitle()}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {customMessage || getDefaultMessage()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Send Realtime Toggle */}
      <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
        <input
          id="sendRealtime"
          type="checkbox"
          checked={sendRealtime}
          onChange={(e) => setSendRealtime(e.target.checked)}
          className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
        />
        <label htmlFor="sendRealtime" className="text-sm text-yellow-800 dark:text-yellow-200">
          {t('sendRealtimeNotification')}
          <span className="ml-2 text-xs bg-yellow-100 dark:bg-yellow-800 px-2 py-1 rounded">
            {t('recommended')}
          </span>
        </label>
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={isSending}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-white font-medium transition-colors ${
            isSending
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          }`}
        >
          {isSending ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              {t('sending')}...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              {t('sendTestNotification')}
            </>
          )}
        </button>
      </div>

      {/* Testing Instructions */}
      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700 mt-6">
        <h4 className="font-semibold text-green-800 dark:text-green-200 mb-3">
          {t('testingInstructions')}
        </h4>
        <div className="space-y-3 text-sm text-green-700 dark:text-green-200">
          <div className="flex items-start gap-2">
            <div className="mt-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
            <div>
              <strong>{t('step1')}</strong>: {t('openConsoleInstructions')}
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="mt-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
            <div>
              <strong>{t('step2')}</strong>: {t('sendNotificationInstructions')}
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="mt-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
            <div>
              <strong>{t('step3')}</strong>: {t('checkConsoleInstructions')}
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="mt-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
            <div>
              <strong>{t('step4')}</strong>: {t('verifyUIInstructions')}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
