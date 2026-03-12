'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

interface Lesson {
  _id: string;
  order: number;
  title: {
    en: string;
    de: string;
    ar: string;
  };
  description: {
    en: string;
    de: string;
    ar: string;
  };
  youtubeVideoId?: string;
  isPublished: boolean;
  isPreview: boolean;
  duration: number;
  createdAt: string;
}

interface LessonManagementPanelProps {
  courseId: string;
  lessons: Lesson[];
  locale: string;
  isInstructor: boolean;
}

export default function LessonManagementPanel({ 
  courseId, 
  lessons, 
  locale, 
  isInstructor 
}: LessonManagementPanelProps) {
  const router = useRouter();
  const [localLessons, setLocalLessons] = useState<Lesson[]>(lessons);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const getLocalizedTitle = (title: { en: string; de: string; ar: string }) => {
    return title[locale as keyof typeof title] || title.en || 'Untitled Lesson';
  };

  const handleTogglePublish = async (lessonId: string, currentStatus: boolean) => {
    setIsLoading(lessonId);
    try {
      const response = await fetch(`/api/courses/${courseId}/lessons/${lessonId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !currentStatus }),
      });

      if (!response.ok) throw new Error('Failed to update lesson');

      setLocalLessons(prev => prev.map(l => 
        l._id === lessonId ? { ...l, isPublished: !currentStatus } : l
      ));
    } catch (error) {
      console.error('Error toggling lesson publish status:', error);
      alert('Failed to update lesson status');
    } finally {
      setIsLoading(null);
    }
  };

  const handleDelete = async (lessonId: string) => {
    if (!confirm(locale === 'ar' ? 'هل أنت متأكد من حذف هذا الدرس؟' : 'Are you sure you want to delete this lesson?')) {
      return;
    }

    setIsLoading(lessonId);
    try {
      const response = await fetch(`/api/courses/${courseId}/lessons/${lessonId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete lesson');

      setLocalLessons(prev => prev.filter(l => l._id !== lessonId));
    } catch (error) {
      console.error('Error deleting lesson:', error);
      alert('Failed to delete lesson');
    } finally {
      setIsLoading(null);
    }
  };

  const handleReorder = async (lessonId: string, direction: 'up' | 'down') => {
    const currentIndex = localLessons.findIndex(l => l._id === lessonId);
    if (currentIndex === -1) return;
    
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === localLessons.length - 1) return;

    const newLessons = [...localLessons];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    // Swap orders
    const tempOrder = newLessons[currentIndex].order;
    newLessons[currentIndex].order = newLessons[targetIndex].order;
    newLessons[targetIndex].order = tempOrder;
    
    // Sort by order
    newLessons.sort((a, b) => a.order - b.order);
    
    setLocalLessons(newLessons);

    // TODO: Save new order to backend
    // This would require a bulk update API endpoint
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {locale === 'ar' ? 'إدارة الدروس' : locale === 'de' ? 'Lektionsverwaltung' : 'Lesson Management'}
        </h3>
        {isInstructor && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {locale === 'ar' ? 'إضافة درس' : locale === 'de' ? 'Lektion hinzufügen' : 'Add Lesson'}
          </button>
        )}
      </div>

      {localLessons.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">
            {locale === 'ar' ? 'لا توجد دروس بعد' : locale === 'de' ? 'Noch keine Lektionen' : 'No lessons yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {localLessons.map((lesson, index) => (
            <div
              key={lesson._id}
              className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              {/* Order Number */}
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                {lesson.order}
              </div>

              {/* Lesson Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-900 dark:text-white truncate">
                    {getLocalizedTitle(lesson.title)}
                  </h4>
                  {lesson.isPreview && (
                    <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full">
                      {locale === 'ar' ? 'معاينة' : 'Preview'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {lesson.youtubeVideoId && (
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                      Video
                    </span>
                  )}
                  <span>{lesson.duration} min</span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex-shrink-0">
                {lesson.isPublished ? (
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full">
                    {locale === 'ar' ? 'منشور' : 'Published'}
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                    {locale === 'ar' ? 'مسودة' : 'Draft'}
                  </span>
                )}
              </div>

              {/* Actions */}
              {isInstructor && (
                <div className="flex items-center gap-1">
                  {/* Reorder Buttons */}
                  <button
                    onClick={() => handleReorder(lesson._id, 'up')}
                    disabled={index === 0 || isLoading === lesson._id}
                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 rounded"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleReorder(lesson._id, 'down')}
                    disabled={index === localLessons.length - 1 || isLoading === lesson._id}
                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 rounded"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

                  {/* Publish Toggle */}
                  <button
                    onClick={() => handleTogglePublish(lesson._id, lesson.isPublished)}
                    disabled={isLoading === lesson._id}
                    className={`p-1.5 rounded transition-colors ${
                      lesson.isPublished 
                        ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20' 
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                    title={lesson.isPublished ? 'Unpublish' : 'Publish'}
                  >
                    {isLoading === lesson._id ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : lesson.isPublished ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>

                  {/* Edit Button */}
                  <button
                    onClick={() => setEditingLesson(lesson)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(lesson._id)}
                    disabled={isLoading === lesson._id}
                    className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TODO: Add Lesson Modal */}
      {/* TODO: Edit Lesson Modal */}
    </div>
  );
}
