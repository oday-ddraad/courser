'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  CreditCard,
  BookOpen,
  Video,
  GraduationCap,
  MessageSquare,
  AlertCircle,
  Loader2,
  CheckCircle,
  XCircle,
  Send,
  Clock,
  PlayCircle,
  StopCircle
} from 'lucide-react';
import { formatDistanceToNow, getRelativeDateLabel } from '@/lib/utils/date';
import { useNotifications } from '@/hooks/useNotifications';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';

type NotificationType = 
  | 'test_notification'
  | 'custom'
  | 'payment_approved' 
  | 'payment_rejected' 
  | 'course_enrolled' 
  | 'live_stream_starting' 
  | 'lesson_available' 
  | 'course_completed' 
  | 'admin_message' 
  | 'instructor_message'
  | 'course_approved'
  | 'course_rejected'
  | 'course_submitted'
  | 'live_lesson_reminder'
  | 'live_lesson_instructor_reminder'
  | 'live_lesson_final_reminder'
  | 'live_lesson_started'
  | 'live_lesson_ended';

interface Notification {
  _id: string;
  type: NotificationType;
  title: {
    en: string;
    de: string;
    ar: string;
  };
  message: {
    en: string;
    de: string;
    ar: string;
  };
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}


const typeIcons: Record<NotificationType, React.ReactNode> = {
  test_notification: <Bell className="w-5 h-5 text-blue-500" />,
  custom: <Bell className="w-5 h-5 text-purple-500" />,
  payment_approved: <CreditCard className="w-5 h-5 text-green-500" />,
  payment_rejected: <CreditCard className="w-5 h-5 text-red-500" />,
  course_enrolled: <BookOpen className="w-5 h-5 text-blue-500" />,
  live_stream_starting: <Video className="w-5 h-5 text-purple-500" />,
  lesson_available: <GraduationCap className="w-5 h-5 text-indigo-500" />,
  course_completed: <GraduationCap className="w-5 h-5 text-green-500" />,
  admin_message: <AlertCircle className="w-5 h-5 text-orange-500" />,
  instructor_message: <MessageSquare className="w-5 h-5 text-teal-500" />,
  course_approved: <CheckCircle className="w-5 h-5 text-green-500" />,
  course_rejected: <XCircle className="w-5 h-5 text-red-500" />,
  course_submitted: <Send className="w-5 h-5 text-blue-500" />,
  live_lesson_reminder: <Clock className="w-5 h-5 text-yellow-500" />,
  live_lesson_instructor_reminder: <Clock className="w-5 h-5 text-orange-500" />,
  live_lesson_final_reminder: <Clock className="w-5 h-5 text-red-500" />,
  live_lesson_started: <PlayCircle className="w-5 h-5 text-green-500" />,
  live_lesson_ended: <StopCircle className="w-5 h-5 text-gray-500" />,
};

const typeColors: Record<NotificationType, string> = {
  test_notification: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
  custom: 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800',
  payment_approved: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
  payment_rejected: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
  course_enrolled: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
  live_stream_starting: 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800',
  lesson_available: 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800',
  course_completed: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
  admin_message: 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800',
  instructor_message: 'bg-teal-50 border-teal-200 dark:bg-teal-900/20 dark:border-teal-800',
  course_approved: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
  course_rejected: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
  course_submitted: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
  live_lesson_reminder: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
  live_lesson_instructor_reminder: 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800',
  live_lesson_final_reminder: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
  live_lesson_started: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
  live_lesson_ended: 'bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800',
};

export default function NotificationsList() {
  const { data: session } = useSession();
  const t = useTranslations('notifications');
  const locale = useLocale();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch,
  } = useNotifications();

  useRealtimeNotifications({
    onNotificationEvent: refetch,
  });

  const getLocalizedText = (obj: { en: string; de: string; ar: string }) => {
    return obj[locale as keyof typeof obj] || obj.en;
  };

  const filteredNotifications = notifications.filter((notification: Notification) => {
    if (filter === 'unread') return !notification.isRead;
    return true;
  });

  // Group notifications by date
  const groupedNotifications = filteredNotifications.reduce((groups: Record<string, Notification[]>, notification: Notification) => {
    const date = new Date(notification.createdAt).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(notification);
    return groups;
  }, {});

  if (!session?.user) {
    return (
      <div className="text-center py-12">
        <Bell className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">Please sign in to view notifications</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 mx-auto text-red-300 mb-4" />
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <Bell className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">{t('noNotifications')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'unread'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            {t('markAllAsRead')}
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-6">
        {Object.entries(groupedNotifications).map(([date, dateNotifications]) => (
          <div key={date}>
            <h3 className="text-sm font-medium text-gray-500 mb-3 sticky top-0 bg-white dark:bg-gray-900 py-2">
              {getRelativeDateLabel(date, locale)}
            </h3>
            <div className="space-y-3">
              {dateNotifications.map((notification: Notification) => (
                <div
                  key={notification._id}
                  onClick={() => {
                    if (notification.actionUrl) {
                      window.location.href = notification.actionUrl;
                    }
                    if (!notification.isRead) {
                      markAsRead(notification._id);
                    }
                  }}
                  className={`p-4 rounded-lg border transition-all cursor-pointer hover:shadow-md ${
                    typeColors[notification.type]
                  } ${!notification.isRead ? 'ring-2 ring-blue-500/20' : ''}`}
                >

                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm">
                      {typeIcons[notification.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className={`font-medium ${
                            !notification.isRead 
                              ? 'text-gray-900 dark:text-white' 
                              : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {getLocalizedText(notification.title)}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {getLocalizedText(notification.message)}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {formatDistanceToNow(notification.createdAt, locale)}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-3" onClick={(e) => e.stopPropagation()}>
                        {!notification.isRead && (
                          <button
                            onClick={() => markAsRead(notification._id)}
                            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                          >
                            <Check className="w-4 h-4" />
                            {t('markAsRead')}
                          </button>
                        )}
                        {notification.actionUrl && (
                          <Link
                            href={notification.actionUrl}
                            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                          >
                            {t('view')}
                          </Link>
                        )}
                        <button
                          onClick={() => deleteNotification(notification._id)}
                          className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 dark:text-red-400 ml-auto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
