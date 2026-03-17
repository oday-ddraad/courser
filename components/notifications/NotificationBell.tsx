'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  X,
  CreditCard,
  BookOpen,
  Video,
  GraduationCap,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  XCircle,
  Send,
  Clock,
  PlayCircle,
  StopCircle
} from 'lucide-react';
import { formatDistanceToNow } from '@/lib/utils/date';
import { useNotifications } from '@/hooks/useNotifications';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';


type NotificationType = 
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
  payment_approved: <CreditCard className="w-4 h-4 text-green-500" />,
  payment_rejected: <CreditCard className="w-4 h-4 text-red-500" />,
  course_enrolled: <BookOpen className="w-4 h-4 text-blue-500" />,
  live_stream_starting: <Video className="w-4 h-4 text-purple-500" />,
  lesson_available: <GraduationCap className="w-4 h-4 text-indigo-500" />,
  course_completed: <GraduationCap className="w-4 h-4 text-green-500" />,
  admin_message: <AlertCircle className="w-4 h-4 text-orange-500" />,
  instructor_message: <MessageSquare className="w-4 h-4 text-teal-500" />,
  course_approved: <CheckCircle className="w-4 h-4 text-green-500" />,
  course_rejected: <XCircle className="w-4 h-4 text-red-500" />,
  course_submitted: <Send className="w-4 h-4 text-blue-500" />,
  live_lesson_reminder: <Clock className="w-4 h-4 text-yellow-500" />,
  live_lesson_instructor_reminder: <Clock className="w-4 h-4 text-orange-500" />,
  live_lesson_final_reminder: <Clock className="w-4 h-4 text-red-500" />,
  live_lesson_started: <PlayCircle className="w-4 h-4 text-green-500" />,
  live_lesson_ended: <StopCircle className="w-4 h-4 text-gray-500" />,
};

const typeColors: Record<NotificationType, string> = {
  payment_approved: 'bg-green-50 border-green-200',
  payment_rejected: 'bg-red-50 border-red-200',
  course_enrolled: 'bg-blue-50 border-blue-200',
  live_stream_starting: 'bg-purple-50 border-purple-200',
  lesson_available: 'bg-indigo-50 border-indigo-200',
  course_completed: 'bg-green-50 border-green-200',
  admin_message: 'bg-orange-50 border-orange-200',
  instructor_message: 'bg-teal-50 border-teal-200',
  course_approved: 'bg-green-50 border-green-200',
  course_rejected: 'bg-red-50 border-red-200',
  course_submitted: 'bg-blue-50 border-blue-200',
  live_lesson_reminder: 'bg-yellow-50 border-yellow-200',
  live_lesson_instructor_reminder: 'bg-orange-50 border-orange-200',
  live_lesson_final_reminder: 'bg-red-50 border-red-200',
  live_lesson_started: 'bg-green-50 border-green-200',
  live_lesson_ended: 'bg-gray-50 border-gray-200',
};

export default function NotificationBell() {
  const { data: session } = useSession();
  const t = useTranslations('notifications');
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch
  } = useNotifications();

  // Enable real-time notifications via Pusher
  useRealtimeNotifications();

  // Close dropdown when clicking outside

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.notification-bell-container')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Poll for new notifications every 30 seconds as fallback
  useEffect(() => {
    if (!session?.user) return;

    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [session, refetch]);


  const handleMarkAsRead = useCallback(async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await markAsRead(id);
  }, [markAsRead]);

  const handleMarkAllAsRead = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    await markAllAsRead();
  }, [markAllAsRead]);

  const handleDelete = useCallback(async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteNotification(id);
  }, [deleteNotification]);

  const getLocalizedText = (obj: { en: string; de: string; ar: string }) => {
    return obj[locale as keyof typeof obj] || obj.en;
  };

  if (!session?.user) {
    return null;
  }

  return (
    <div className="notification-bell-container relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label={t('notifications')}
      >
        <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {t('title')}
            </h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                  title={t('markAllAsRead')}
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto flex-1 max-h-[60vh]">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                {t('loading')}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>{t('noNotifications')}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    onClick={() => {
                      if (notification.actionUrl) {
                        window.location.href = notification.actionUrl;
                      }
                      if (!notification.isRead) {
                        markAsRead(notification._id);
                      }
                      setIsOpen(false);
                    }}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer ${
                      !notification.isRead ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''
                    }`}
                  >

                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${typeColors[notification.type]}`}>
                        {typeIcons[notification.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-medium ${
                            !notification.isRead 
                              ? 'text-gray-900 dark:text-white' 
                              : 'text-gray-600 dark:text-gray-300'
                          }`}>
                            {getLocalizedText(notification.title)}
                          </p>
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {formatDistanceToNow(notification.createdAt, locale)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                          {getLocalizedText(notification.message)}
                        </p>
                        <div className="flex items-center gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                          {!notification.isRead && (
                            <button
                              onClick={(e) => handleMarkAsRead(e, notification._id)}
                              className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              {t('markAsRead')}
                            </button>
                          )}
                          {notification.actionUrl && (
                            <Link
                              href={notification.actionUrl}
                              onClick={() => setIsOpen(false)}
                              className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                            >
                              {t('view')}
                            </Link>
                          )}
                          <button
                            onClick={(e) => handleDelete(e, notification._id)}
                            className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 flex items-center gap-1 ml-auto"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center">
            <Link
              href="/dashboard/notifications"
              onClick={() => setIsOpen(false)}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              {t('viewAll')}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
