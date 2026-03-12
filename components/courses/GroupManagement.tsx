'use client';

import { useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';

interface Group {
  _id: string;
  name: {
    en: string;
    de: string;
    ar: string;
  };
  description: {
    en: string;
    de: string;
    ar: string;
  };
  studentIds: string[];
  maxStudents: number;
  schedule: {
    _id: string;
    dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
    time: string;
    lessonType: 'live' | 'recorded';
    isActive: boolean;
  }[];
  notificationSettings: {
    enabled: boolean;
    earlyMorningEnabled: boolean;
    earlyMorningTime: string;
    oneHourEnabled: boolean;
    notificationTypes: ('email' | 'in_app')[];
  };
}

interface GroupManagementProps {
  courseId: string;
  locale: string;
  userRole: 'admin' | 'instructor';
}

const daysOfWeek = [
  { key: 'monday', en: 'Monday', ar: 'الإثنين' },
  { key: 'tuesday', en: 'Tuesday', ar: 'الثلاثاء' },
  { key: 'wednesday', en: 'Wednesday', ar: 'الأربعاء' },
  { key: 'thursday', en: 'Thursday', ar: 'الخميس' },
  { key: 'friday', en: 'Friday', ar: 'الجمعة' },
  { key: 'saturday', en: 'Saturday', ar: 'السبت' },
  { key: 'sunday', en: 'Sunday', ar: 'الأحد' },
];

export default function GroupManagement({ courseId, locale, userRole }: GroupManagementProps) {
  const t = useTranslations('courses');
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeLangTab, setActiveLangTab] = useState<'en' | 'de' | 'ar'>('en');

  // Form state for creating/editing group
  const [formData, setFormData] = useState({
    name: { en: '', de: '', ar: '' },
    description: { en: '', de: '', ar: '' },
    maxStudents: 20,
    schedule: [] as {
      dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
      time: string;
      lessonType: 'live' | 'recorded';
      isActive: boolean;
    }[],
    notificationSettings: {
      enabled: true,
      earlyMorningEnabled: true,
      earlyMorningTime: '08:00',
      oneHourEnabled: true,
      notificationTypes: ['email', 'in_app'] as ('email' | 'in_app')[],
    },
  });

  useEffect(() => {
    fetchGroups();
  }, [courseId]);

  const fetchGroups = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/courses/${courseId}/groups`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch groups');
      }

      setGroups(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create group');
      }

      fetchGroups();
      resetForm();
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateGroup = async (groupId: string) => {
    try {
      const response = await fetch(`/api/courses/${courseId}/groups/${groupId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update group');
      }

      fetchGroups();
      resetForm();
      setIsEditing(false);
      setSelectedGroup(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm(locale === 'ar' ? 'هل أنت متأكد من حذف هذه المجموعة؟' : 'Are you sure you want to delete this group?')) {
      return;
    }

    try {
      const response = await fetch(`/api/courses/${courseId}/groups/${groupId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete group');
      }

      fetchGroups();
      setSelectedGroup(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: { en: '', de: '', ar: '' },
      description: { en: '', de: '', ar: '' },
      maxStudents: 20,
      schedule: [],
      notificationSettings: {
        enabled: true,
        earlyMorningEnabled: true,
        earlyMorningTime: '08:00',
        oneHourEnabled: true,
        notificationTypes: ['email', 'in_app'],
      },
    });
  };

  const startEditGroup = (group: Group) => {
    setFormData({
      name: group.name,
      description: group.description,
      maxStudents: group.maxStudents,
      schedule: group.schedule.map(s => ({
        dayOfWeek: s.dayOfWeek,
        time: s.time,
        lessonType: s.lessonType,
        isActive: s.isActive,
      })),
      notificationSettings: {
        enabled: group.notificationSettings.enabled,
        earlyMorningEnabled: group.notificationSettings.earlyMorningEnabled,
        earlyMorningTime: group.notificationSettings.earlyMorningTime,
        oneHourEnabled: group.notificationSettings.oneHourEnabled,
        notificationTypes: group.notificationSettings.notificationTypes,
      },
    });
    setSelectedGroup(group);
    setIsEditing(true);
  };

  const addScheduleItem = () => {
    setFormData(prev => ({
      ...prev,
      schedule: [
        ...prev.schedule,
        {
          dayOfWeek: 'monday',
          time: '09:00',
          lessonType: 'live',
          isActive: true,
        },
      ],
    }));
  };

  const updateScheduleItem = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      schedule: prev.schedule.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const removeScheduleItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      schedule: prev.schedule.filter((_, i) => i !== index),
    }));
  };

  const renderLanguageTabs = () => (
    <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-gray-700">
      {[
        { code: 'en', name: 'English', nameAr: 'الإنجليزية' },
        { code: 'de', name: 'Deutsch', nameAr: 'الألمانية' },
        { code: 'ar', name: 'العربية', nameAr: 'العربية' },
      ].map((lang) => (
        <button
          key={lang.code}
          type="button"
          onClick={() => setActiveLangTab(lang.code as 'en' | 'de' | 'ar')}
          className={`
            px-4 py-2 font-medium transition-colors
            ${activeLangTab === lang.code
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }
          `}
        >
          {locale === 'ar' ? lang.nameAr : lang.name}
        </button>
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {locale === 'ar' ? 'إدارة المجموعات' : 'Group Management'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {locale === 'ar' ? 'إدارة مجموعات الطلاب والجداول' : 'Manage student groups and schedules'}
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsEditing(true);
            setSelectedGroup(null);
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {locale === 'ar' ? 'إنشاء مجموعة' : 'Create Group'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-sm underline">
            {locale === 'ar' ? 'إغلاق' : 'Dismiss'}
          </button>
        </div>
      )}

      {/* Groups List */}
      <div className="grid gap-4 mb-8">
        {groups.map((group) => (
          <div
            key={group._id}
            className={`bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 cursor-pointer transition-all ${
              selectedGroup?._id === group._id ? 'ring-2 ring-blue-500' : 'hover:shadow-lg'
            }`}
            onClick={() => setSelectedGroup(selectedGroup?._id === group._id ? null : group)}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {group.name.en}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                  {group.studentIds.length} / {group.maxStudents} {locale === 'ar' ? 'طلاب' : 'students'}
                </p>
                <div className="flex gap-2">
                  {group.schedule.map((schedule, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-full"
                    >
                      {locale === 'ar' 
                        ? daysOfWeek.find(d => d.key === schedule.dayOfWeek)?.ar
                        : daysOfWeek.find(d => d.key === schedule.dayOfWeek)?.en
                      } {schedule.time}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startEditGroup(group);
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                {group.name.en !== 'GROUP A' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteGroup(group._id);
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Group Form */}
      {isEditing && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {selectedGroup 
              ? (locale === 'ar' ? 'تعديل المجموعة' : 'Edit Group')
              : (locale === 'ar' ? 'إنشاء مجموعة جديدة' : 'Create New Group')
            }
          </h3>

          {renderLanguageTabs()}

          {/* Group Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {locale === 'ar' ? 'اسم المجموعة' : 'Group Name'} ({activeLangTab})
            </label>
            <input
              type="text"
              value={formData.name[activeLangTab]}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                name: { ...prev.name, [activeLangTab]: e.target.value }
              }))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder={locale === 'ar' ? 'أدخل اسم المجموعة' : 'Enter group name'}
            />
          </div>

          {/* Group Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {locale === 'ar' ? 'وصف المجموعة' : 'Group Description'} ({activeLangTab})
            </label>
            <textarea
              value={formData.description[activeLangTab]}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                description: { ...prev.description, [activeLangTab]: e.target.value }
              }))}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder={locale === 'ar' ? 'أدخل وصف المجموعة' : 'Enter group description'}
            />
          </div>

          {/* Max Students */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {locale === 'ar' ? 'الحد الأقصى للطلاب' : 'Maximum Students'}
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={formData.maxStudents}
              onChange={(e) => setFormData(prev => ({ ...prev, maxStudents: parseInt(e.target.value) }))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Schedule */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {locale === 'ar' ? 'الجدول الزمني' : 'Schedule'}
              </label>
              <button
                type="button"
                onClick={addScheduleItem}
                className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
              >
                + {locale === 'ar' ? 'إضافة موعد' : 'Add Schedule'}
              </button>
            </div>
            
            {formData.schedule.map((schedule, index) => (
              <div key={index} className="flex gap-2 mb-2 items-center">
                <select
                  value={schedule.dayOfWeek}
                  onChange={(e) => updateScheduleItem(index, 'dayOfWeek', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  {daysOfWeek.map((day) => (
                    <option key={day.key} value={day.key}>
                      {locale === 'ar' ? day.ar : day.en}
                    </option>
                  ))}
                </select>
                <input
                  type="time"
                  value={schedule.time}
                  onChange={(e) => updateScheduleItem(index, 'time', e.target.value)}
                  className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
                <select
                  value={schedule.lessonType}
                  onChange={(e) => updateScheduleItem(index, 'lessonType', e.target.value)}
                  className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="live">{locale === 'ar' ? 'مباشر' : 'Live'}</option>
                  <option value="recorded">{locale === 'ar' ? 'مسجل' : 'Recorded'}</option>
                </select>
                <button
                  type="button"
                  onClick={() => removeScheduleItem(index)}
                  className="text-red-600 hover:text-red-700 transition-colors px-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Notification Settings */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-4">
              {locale === 'ar' ? 'إعدادات الإشعارات' : 'Notification Settings'}
            </h4>
            
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.notificationSettings.enabled}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    notificationSettings: { ...prev.notificationSettings, enabled: e.target.checked }
                  }))}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700 dark:text-gray-300">
                  {locale === 'ar' ? 'تفعيل الإشعارات' : 'Enable Notifications'}
                </span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.notificationSettings.earlyMorningEnabled}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    notificationSettings: { ...prev.notificationSettings, earlyMorningEnabled: e.target.checked }
                  }))}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700 dark:text-gray-300">
                  {locale === 'ar' ? 'إشعار الصباح الباكر' : 'Early Morning Notification'}
                </span>
              </label>

              {formData.notificationSettings.earlyMorningEnabled && (
                <input
                  type="time"
                  value={formData.notificationSettings.earlyMorningTime}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    notificationSettings: { ...prev.notificationSettings, earlyMorningTime: e.target.value }
                  }))}
                  className="ml-8 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
              )}

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.notificationSettings.oneHourEnabled}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    notificationSettings: { ...prev.notificationSettings, oneHourEnabled: e.target.checked }
                  }))}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700 dark:text-gray-300">
                  {locale === 'ar' ? 'إشعار قبل ساعة' : 'One Hour Before Notification'}
                </span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => {
                setIsEditing(false);
                setSelectedGroup(null);
                resetForm();
              }}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
            >
              {locale === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              onClick={() => selectedGroup ? handleUpdateGroup(selectedGroup._id) : handleCreateGroup()}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              {selectedGroup 
                ? (locale === 'ar' ? 'حفظ التغييرات' : 'Save Changes')
                : (locale === 'ar' ? 'إنشاء المجموعة' : 'Create Group')
              }
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
