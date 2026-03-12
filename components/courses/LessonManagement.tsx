'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { Plus, ArrowLeft, Loader2, Play, Clock, Check, Trash2, Edit, Folder, Radio, StopCircle, Eye, EyeOff, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import LessonFormModal from './LessonFormModal';

interface MultilingualContent { en: string; de: string; ar: string; }
interface GoogleDriveLink { name: MultilingualContent; url: string; type: 'folder' | 'file' | 'document' | 'spreadsheet' | 'presentation'; }
interface Lesson {
  _id?: string; id?: string; order: number;
  title: MultilingualContent; description: MultilingualContent;
  youtubeVideoId?: string; youtubeUrl?: string; duration: number;
  isPublished: boolean; isPreview?: boolean; googleDriveLinks: GoogleDriveLink[];
  createdAt?: string; scheduledDateTime?: string; scheduleTimezone?: string;
  reminderMinutesBefore?: number; isLiveStream?: boolean; liveMeetingId?: string;
  liveStatus?: 'scheduled' | 'live' | 'ended';
}
interface Course { _id: string; slug: string; title: MultilingualContent; approvalStatus: 'pending' | 'approved' | 'rejected'; courseType: 'live' | 'uploaded'; instructorIds: string[]; }
interface LessonManagementProps { courseId: string; courseSlug: string; userRole: 'admin' | 'instructor'; userId?: string; backLink: string; canEdit: boolean; canDelete: boolean; canPublish: boolean; }

function getLessonId(l: Lesson) { return l._id || l.id || ''; }

function StatusBadge({ lesson, locale }: { lesson: Lesson; locale: string }) {
  if (lesson.isLiveStream) {
    if (lesson.liveStatus === 'live') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"><Radio className="w-3 h-3 animate-pulse" />{locale === 'ar' ? 'مباشر' : 'LIVE'}</span>;
    if (lesson.liveStatus === 'ended') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"><StopCircle className="w-3 h-3" />{locale === 'ar' ? 'انتهى' : 'Ended'}</span>;
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"><Clock className="w-3 h-3" />{locale === 'ar' ? 'مجدول' : 'Scheduled'}</span>;
  }
  if (lesson.isPublished) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"><Check className="w-3 h-3" />{locale === 'ar' ? 'منشور' : 'Published'}</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"><EyeOff className="w-3 h-3" />{locale === 'ar' ? 'مسودة' : 'Draft'}</span>;
}

const defaultForm = (lessonCount: number, isLive: boolean) => ({
  title: { en: `Lesson ${lessonCount + 1}`, de: '', ar: '' } as MultilingualContent,
  description: { en: '', de: '', ar: '' } as MultilingualContent,
  youtubeUrl: '', duration: isLive ? 60 : 20, isPublished: false,
  isPreview: lessonCount === 0, googleDriveLinks: [] as GoogleDriveLink[],
  scheduledDateTime: '', scheduleTimezone: 'UTC', reminderMinutesBefore: 30,
});

export default function LessonManagement({ courseId, courseSlug, userRole, userId, backLink, canEdit, canDelete, canPublish }: LessonManagementProps) {
  const locale = useLocale();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeLangTab, setActiveLangTab] = useState<'en' | 'de' | 'ar'>('en');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [liveActionLoading, setLiveActionLoading] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ id: string; type: 'success' | 'error'; msg: string } | null>(null);
  const [form, setForm] = useState(defaultForm(0, false));

  const isLiveCourse = course?.courseType === 'live';

  useEffect(() => { fetchData(); }, [courseId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch course info and lessons in parallel
      const [courseRes, lessonsRes] = await Promise.all([
        fetch(`/api/courses/${courseId}`),
        fetch(`/api/courses/${courseId}/lessons`),
      ]);
      const courseData = await courseRes.json();
      const lessonsData = await lessonsRes.json();
      if (courseData.success && courseData.data) {
        setCourse(courseData.data);
      }
      if (lessonsData.success) {
        // API returns { success: true, data: lessons[] }
        setLessons(lessonsData.data || []);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const openAddModal = () => {
    setEditingLesson(null);
    setForm(defaultForm(lessons.length, isLiveCourse || false));
    setShowAdvanced(false); setActiveLangTab('en'); setShowModal(true);
  };

  const openEditModal = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setForm({ title: { ...lesson.title }, description: { ...lesson.description }, youtubeUrl: lesson.youtubeUrl || '', duration: lesson.duration || 0, isPublished: lesson.isPublished, isPreview: lesson.isPreview || false, googleDriveLinks: lesson.googleDriveLinks ? [...lesson.googleDriveLinks] : [], scheduledDateTime: lesson.scheduledDateTime || '', scheduleTimezone: lesson.scheduleTimezone || 'UTC', reminderMinutesBefore: lesson.reminderMinutesBefore || 30 });
    setShowAdvanced(false); setActiveLangTab('en'); setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingLesson(null); };

  const extractYouTubeId = (url: string) => { const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/); return m ? m[1] : null; };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.en.trim()) return;
    setSaving(true);
    try {
      const title = { ...form.title };
      const description = { ...form.description };
      (['de', 'ar'] as const).forEach((lang) => { if (!title[lang]) title[lang] = title.en; if (!description[lang]) description[lang] = description.en; });
      const payload: any = { title, description, content: { en: '', de: '', ar: '' }, youtubeVideoId: form.youtubeUrl ? extractYouTubeId(form.youtubeUrl) : null, videoUrl: form.youtubeUrl, duration: form.duration, isPublished: form.isPublished, isPreview: form.isPreview, isLiveStream: isLiveCourse, googleDriveLinks: form.googleDriveLinks.map((l) => ({ name: { en: l.name.en || l.name.ar || l.name.de || 'Material', de: l.name.de || l.name.en || 'Material', ar: l.name.ar || l.name.en || 'المادة' }, url: l.url, type: l.type })) };
      if (isLiveCourse && form.scheduledDateTime) { payload.scheduledDateTime = form.scheduledDateTime; payload.scheduleTimezone = form.scheduleTimezone; payload.reminderMinutesBefore = form.reminderMinutesBefore; }
      let res;
      if (editingLesson) {
        res = await fetch(`/api/courses/${courseId}/lessons/${getLessonId(editingLesson)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      } else {
        payload.order = lessons.length + 1;
        res = await fetch(`/api/courses/${courseId}/lessons`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      }
      if (res && res.ok) { await fetchData(); closeModal(); }
    } catch (e) { console.error(e); } finally { setSaving(false); }
  };

  const handleDelete = async (lesson: Lesson) => {
    if (!confirm(locale === 'ar' ? 'هل أنت متأكد من حذف هذا الدرس؟' : 'Delete this lesson?')) return;
    await fetch(`/api/courses/${courseId}/lessons/${getLessonId(lesson)}`, { method: 'DELETE' });
    await fetchData();
  };

  const handleTogglePublish = async (lesson: Lesson) => {
    await fetch(`/api/courses/${courseId}/lessons/${getLessonId(lesson)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isPublished: !lesson.isPublished }) });
    await fetchData();
  };

  const handleStartLive = async (lesson: Lesson) => {
    const id = getLessonId(lesson); setLiveActionLoading(id); setActionFeedback(null);
    try {
      const res = await fetch(`/api/courses/${courseId}/lessons/${id}/start-live`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) { setActionFeedback({ id, type: 'success', msg: locale === 'ar' ? 'بدأ البث المباشر!' : 'Live lesson started!' }); await fetchData(); }
      else { setActionFeedback({ id, type: 'error', msg: data.error || 'Failed to start live' }); }
    } catch { setActionFeedback({ id, type: 'error', msg: 'Network error' }); } finally { setLiveActionLoading(null); }
  };

  const handleEndLive = async (lesson: Lesson) => {
    if (!confirm(locale === 'ar' ? 'إنهاء البث المباشر؟' : 'End the live session?')) return;
    const id = getLessonId(lesson); setLiveActionLoading(id); setActionFeedback(null);
    try {
      const res = await fetch(`/api/courses/${courseId}/lessons/${id}/end-live`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) { setActionFeedback({ id, type: 'success', msg: locale === 'ar' ? 'انتهى البث المباشر.' : 'Live session ended.' }); await fetchData(); }
      else { setActionFeedback({ id, type: 'error', msg: data.error || 'Failed to end live' }); }
    } catch { setActionFeedback({ id, type: 'error', msg: 'Network error' }); } finally { setLiveActionLoading(null); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  const courseTitle = course?.title?.[locale as keyof MultilingualContent] || course?.title?.en || '';

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href={backLink} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{locale === 'ar' ? 'إدارة الدروس' : 'Lesson Management'}</h1>
            {courseTitle && <p className="text-sm text-gray-500 dark:text-gray-400">{courseTitle}</p>}
          </div>
        </div>
        {canEdit && (
          <button onClick={openAddModal} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium">
            <Plus className="w-4 h-4" />{locale === 'ar' ? 'إضافة درس' : 'Add Lesson'}
          </button>
        )}
      </div>

      {/* Course type badge */}
      {course && (
        <div className="mb-4 flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${isLiveCourse ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
            {isLiveCourse ? <Radio className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isLiveCourse ? (locale === 'ar' ? 'دورة مباشرة' : 'Live Course') : (locale === 'ar' ? 'دورة مسجلة' : 'Pre-recorded Course')}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">{lessons.length} {locale === 'ar' ? 'درس' : 'lessons'}</span>
        </div>
      )}

      {/* Lessons List */}
      {lessons.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl">
          <Play className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">{locale === 'ar' ? 'لا توجد دروس بعد' : 'No lessons yet'}</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{locale === 'ar' ? 'انقر على "إضافة درس" للبدء' : 'Click "Add Lesson" to get started'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson, index) => {
            const lessonId = getLessonId(lesson);
            const title = lesson.title?.[locale as keyof MultilingualContent] || lesson.title?.en || `Lesson ${index + 1}`;
            const isLoading = liveActionLoading === lessonId;
            const feedback = actionFeedback?.id === lessonId ? actionFeedback : null;
            return (
              <div key={lessonId} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm font-semibold text-gray-600 dark:text-gray-300 flex-shrink-0">{index + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">{title}</h3>
                        <StatusBadge lesson={lesson} locale={locale} />
                        {lesson.isPreview && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                            <Eye className="w-3 h-3" />{locale === 'ar' ? 'معاينة' : 'Preview'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        {lesson.duration > 0 && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{lesson.duration} {locale === 'ar' ? 'د' : 'min'}</span>}
                        {lesson.googleDriveLinks?.length > 0 && <span className="flex items-center gap-1"><Folder className="w-3 h-3" />{lesson.googleDriveLinks.length} {locale === 'ar' ? 'ملف' : 'files'}</span>}
                        {isLiveCourse && lesson.scheduledDateTime && (
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(lesson.scheduledDateTime).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isLiveCourse && canEdit && (
                      <>
                        {lesson.liveStatus !== 'live' && lesson.liveStatus !== 'ended' && (
                          <button onClick={() => handleStartLive(lesson)} disabled={isLoading} className="flex items-center gap-1 px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition disabled:opacity-50">
                            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Radio className="w-3 h-3" />}{locale === 'ar' ? 'بث' : 'Go Live'}
                          </button>
                        )}
                        {lesson.liveStatus === 'live' && (
                          <button onClick={() => handleEndLive(lesson)} disabled={isLoading} className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-700 hover:bg-gray-800 text-white rounded-lg text-xs font-medium transition disabled:opacity-50">
                            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <StopCircle className="w-3 h-3" />}{locale === 'ar' ? 'إنهاء' : 'End'}
                          </button>
                        )}
                      </>
                    )}
                    {canPublish && !isLiveCourse && (
                      <button onClick={() => handleTogglePublish(lesson)} className={`p-1.5 rounded-lg transition ${lesson.isPublished ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                        {lesson.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    )}
                    {canEdit && (
                      <button onClick={() => openEditModal(lesson)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition">
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => handleDelete(lesson)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                {feedback && (
                  <div className={`mt-2 flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${feedback.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
                    {feedback.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {feedback.msg}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <LessonFormModal
          locale={locale}
          isEditing={!!editingLesson}
          isLiveCourse={isLiveCourse || false}
          saving={saving}
          form={form}
          setForm={setForm}
          activeLangTab={activeLangTab}
          setActiveLangTab={setActiveLangTab}
          showAdvanced={showAdvanced}
          setShowAdvanced={setShowAdvanced}
          onClose={closeModal}
          onSubmit={handleSave}
        />
      )}
    </div>
  );
}
