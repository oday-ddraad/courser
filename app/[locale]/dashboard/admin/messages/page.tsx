'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/auth/permissions';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { 
  Send, 
  Users, 
  BookOpen, 
  Check,
  X,
  Loader2,
  MessageSquare,
  Bell,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

interface Course {
  _id: string;
  title: {
    en: string;
    de: string;
    ar: string;
  };
  slug: string;
  totalStudents: number;
}

interface Group {
  _id: string;
  name: string;
  courseId: string;
  studentCount: number;
  students?: Array<{ _id: string }>;
}


export default function AdminMessagesPage() {
  const { data: session, status } = useSession();
  const t = useTranslations('Dashboard.admin.messages');
  const [courses, setCourses] = useState<Course[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form state
  const [targetType, setTargetType] = useState<'all' | 'course' | 'group'>('all');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [messageType, setMessageType] = useState<'notification' | 'email' | 'sms'>('notification');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal');

  useEffect(() => {
    if (status !== 'loading' && session && hasPermission(session.user.role, 'notification.send')) {
      fetchCourses();
    }
  }, [status, session]);

  useEffect(() => {
    if (selectedCourse && targetType === 'group') {
      fetchGroups(selectedCourse);
    }
  }, [selectedCourse, targetType]);

  if (status === 'loading') {
    return <div className="p-6">Loading...</div>;
  }

  if (!session || !hasPermission(session.user.role, 'notification.send')) {
    redirect('/forbidden');
  }


  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses?limit=1000');
      const data = await response.json();
      if (data.success) {
        setCourses(data.data.courses);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async (courseId: string) => {
    try {
      const response = await fetch(`/api/courses/${courseId}/groups`);
      const data = await response.json();
      if (data.success) {
        setGroups(data.data.map((g: Group) => ({
          ...g,
          courseId,
          studentCount: g.students?.length || 0,
        })));
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setSuccess(false);

    try {
      let targetUsers: string[] = [];

      // Determine target users based on selection
      if (targetType === 'all') {
        // Get all users
        const response = await fetch('/api/users?limit=10000');
        const data = await response.json();
        if (data.success) {
          targetUsers = data.data.users.map((u: { _id: string }) => u._id);
        }
      } else if (targetType === 'course') {
        // Get course enrollees
        const response = await fetch(`/api/courses/${selectedCourse}/enrollments`);
        const data = await response.json();
        if (data.success) {
          targetUsers = data.data.map((e: { userId: string }) => e.userId);
        }
      } else if (targetType === 'group') {
        // Get group members
        const response = await fetch(`/api/courses/${selectedCourse}/groups/${selectedGroup}`);
        const data = await response.json();
        if (data.success) {
          targetUsers = data.data.students.map((s: { _id: string }) => s._id);
        }
      }

      if (targetUsers.length === 0) {
        alert(t('noRecipients'));
        setSending(false);
        return;
      }

      // Send message to each user
      const sendPromises = targetUsers.map(userId => 
        fetch('/api/admin/send-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            type: messageType,
            title,
            message,
            priority,
            courseId: selectedCourse || undefined,
            groupId: selectedGroup || undefined,
          }),
        })
      );

      await Promise.all(sendPromises);

      setSuccess(true);
      setTitle('');
      setMessage('');
      setTimeout(() => setSuccess(false), 5000);
    } catch (error) {
      console.error('Error sending message:', error);
      alert(t('sendError'));
    } finally {
      setSending(false);
    }
  };

  const getRecipientCount = () => {
    if (targetType === 'all') {
      return t('allUsers');
    } else if (targetType === 'course') {
      const course = courses.find(c => c._id === selectedCourse);
      return course ? `${course.totalStudents || 0} ${t('students')}` : t('selectCourse');
    } else if (targetType === 'group') {
      const group = groups.find(g => g._id === selectedGroup);
      return group ? `${group.studentCount} ${t('students')}` : t('selectGroup');
    }
    return '';
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {t('subtitle')}
        </p>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-600 rounded-lg flex items-center text-green-700 dark:text-green-300">
          <Check className="w-5 h-5 mr-2" />
          {t('messageSent')}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Target Selection */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            {t('recipients')}
          </h2>

          <div className="space-y-4">
            {/* Target Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('targetType')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setTargetType('all')}
                  className={`p-3 border rounded-lg text-left transition ${
                    targetType === 'all'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-white">{t('allUsers')}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{t('allUsersDesc')}</div>
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType('course')}
                  className={`p-3 border rounded-lg text-left transition ${
                    targetType === 'course'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-white">{t('courseEnrollees')}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{t('courseEnrolleesDesc')}</div>
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType('group')}
                  className={`p-3 border rounded-lg text-left transition ${
                    targetType === 'group'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-white">{t('specificGroup')}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{t('specificGroupDesc')}</div>
                </button>
              </div>
            </div>

            {/* Course Selection */}
            {(targetType === 'course' || targetType === 'group') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('selectCourse')} *
                </label>
                <select
                  required
                  value={selectedCourse}
                  onChange={(e) => {
                    setSelectedCourse(e.target.value);
                    setSelectedGroup('');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                >
                  <option value="">{t('chooseCourse')}</option>
                  {courses.map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.title.en} ({course.totalStudents || 0} {t('students')})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Group Selection */}
            {targetType === 'group' && selectedCourse && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('selectGroup')} *
                </label>
                <select
                  required
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                >
                  <option value="">{t('chooseGroup')}</option>
                  {groups.map((group) => (
                    <option key={group._id} value={group._id}>
                      {group.name} ({group.studentCount} {t('students')})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Recipient Count */}
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center">
              <Bell className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-sm text-blue-800 dark:text-blue-200">
                {t('willBeSentTo')}: <strong>{getRecipientCount()}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Message Content */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            {t('messageContent')}
          </h2>

          <div className="space-y-4">
            {/* Message Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('messageType')}
              </label>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setMessageType('notification')}
                  className={`px-4 py-2 rounded-lg transition ${
                    messageType === 'notification'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {t('notification')}
                </button>
                <button
                  type="button"
                  onClick={() => setMessageType('email')}
                  className={`px-4 py-2 rounded-lg transition ${
                    messageType === 'email'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {t('email')}
                </button>
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('priority')}
              </label>
              <div className="flex space-x-3">
                {(['low', 'normal', 'high'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`px-4 py-2 rounded-lg transition flex items-center ${
                      priority === p
                        ? p === 'high'
                          ? 'bg-red-600 text-white'
                          : p === 'normal'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-600 text-white'
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {p === 'high' && <AlertCircle className="w-4 h-4 mr-1" />}
                    {t(`priority${p.charAt(0).toUpperCase() + p.slice(1)}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('title')} *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                placeholder={t('titlePlaceholder')}
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('message')} *
              </label>
              <textarea
                required
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                placeholder={t('messagePlaceholder')}
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={sending}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-lg font-medium"
          >
            {sending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {t('sending')}
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                {t('sendMessage')}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
