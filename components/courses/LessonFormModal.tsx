'use client';

import { X, ChevronDown, ChevronUp, Plus, Trash2, Save, Loader2 } from 'lucide-react';

interface MultilingualContent { en: string; de: string; ar: string; }
interface GoogleDriveLink {
  name: MultilingualContent;
  url: string;
  type: 'folder' | 'file' | 'document' | 'spreadsheet' | 'presentation';
}
interface FormState {
  title: MultilingualContent;
  description: MultilingualContent;
  youtubeUrl: string;
  duration: number;
  isPublished: boolean;
  isPreview: boolean;
  googleDriveLinks: GoogleDriveLink[];
  scheduledDateTime: string;
  scheduleTimezone: string;
  reminderMinutesBefore: number;
}

interface LessonFormModalProps {
  locale: string;
  isEditing: boolean;
  isLiveCourse: boolean;
  saving: boolean;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  activeLangTab: 'en' | 'de' | 'ar';
  setActiveLangTab: (lang: 'en' | 'de' | 'ar') => void;
  showAdvanced: boolean;
  setShowAdvanced: (v: boolean) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function LessonFormModal({
  locale, isEditing, isLiveCourse, saving, form, setForm,
  activeLangTab, setActiveLangTab, showAdvanced, setShowAdvanced,
  onClose, onSubmit,
}: LessonFormModalProps) {
  const isAr = locale === 'ar';

  const addDriveLink = () => setForm((p) => ({ ...p, googleDriveLinks: [...p.googleDriveLinks, { name: { en: '', de: '', ar: '' }, url: '', type: 'file' as const }] }));
  const removeDriveLink = (i: number) => setForm((p) => ({ ...p, googleDriveLinks: p.googleDriveLinks.filter((_, idx) => idx !== i) }));
  const updateDriveLink = (i: number, field: string, value: string) => setForm((p) => ({ ...p, googleDriveLinks: p.googleDriveLinks.map((l, idx) => idx === i ? { ...l, [field]: value } : l) }));
  const updateDriveLinkName = (i: number, lang: 'en' | 'de' | 'ar', value: string) => setForm((p) => ({ ...p, googleDriveLinks: p.googleDriveLinks.map((l, idx) => idx === i ? { ...l, name: { ...l.name, [lang]: value } } : l) }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {isEditing ? (isAr ? 'تعديل الدرس' : 'Edit Lesson') : (isAr ? 'إضافة درس جديد' : 'Add New Lesson')}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-5 space-y-5">
          {/* Language Tabs */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {(['en', 'de', 'ar'] as const).map((lang) => (
              <button key={lang} type="button" onClick={() => setActiveLangTab(lang)}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition ${activeLangTab === lang ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                {lang === 'en' ? 'English' : lang === 'de' ? 'Deutsch' : 'العربية'}
              </button>
            ))}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {isAr ? 'عنوان الدرس' : 'Lesson Title'}{activeLangTab === 'en' && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input type="text" dir={activeLangTab === 'ar' ? 'rtl' : 'ltr'}
              value={form.title[activeLangTab]}
              onChange={(e) => setForm((p) => ({ ...p, title: { ...p.title, [activeLangTab]: e.target.value } }))}
              required={activeLangTab === 'en'}
              placeholder={activeLangTab === 'en' ? 'e.g. Introduction' : activeLangTab === 'de' ? 'z.B. Einführung' : 'مثال: مقدمة'}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
            {activeLangTab !== 'en' && <p className="text-xs text-gray-400 mt-1">{isAr ? 'اختياري — سيُستخدم الإنجليزي كبديل' : 'Optional — English used as fallback'}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {isAr ? 'وصف الدرس' : 'Description'} <span className="text-gray-400 text-xs">({isAr ? 'اختياري' : 'optional'})</span>
            </label>
            <textarea dir={activeLangTab === 'ar' ? 'rtl' : 'ltr'}
              value={form.description[activeLangTab]}
              onChange={(e) => setForm((p) => ({ ...p, description: { ...p.description, [activeLangTab]: e.target.value } }))}
              rows={2} placeholder={isAr ? 'وصف مختصر...' : 'Brief description...'}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{isAr ? 'المدة (بالدقائق)' : 'Duration (minutes)'}</label>
            <input type="number" min={0} value={form.duration}
              onChange={(e) => setForm((p) => ({ ...p, duration: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Video URL (uploaded only) */}
          {!isLiveCourse && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {isAr ? 'رابط يوتيوب' : 'YouTube URL'} <span className="text-gray-400 text-xs">({isAr ? 'اختياري' : 'optional'})</span>
              </label>
              <input type="url" value={form.youtubeUrl}
                onChange={(e) => setForm((p) => ({ ...p, youtubeUrl: e.target.value }))}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          )}

          {/* Scheduled DateTime (live only) */}
          {isLiveCourse && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {isAr ? 'موعد الدرس المباشر' : 'Scheduled Date & Time'} <span className="text-gray-400 text-xs">({isAr ? 'اختياري' : 'optional'})</span>
              </label>
              <input type="datetime-local" value={form.scheduledDateTime}
                onChange={(e) => setForm((p) => ({ ...p, scheduledDateTime: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          )}

          {/* Visibility toggles */}
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isPublished}
                onChange={(e) => setForm((p) => ({ ...p, isPublished: e.target.checked }))}
                className="w-4 h-4 rounded text-blue-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{isAr ? 'نشر الدرس' : 'Publish lesson'}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isPreview}
                onChange={(e) => setForm((p) => ({ ...p, isPreview: e.target.checked }))}
                className="w-4 h-4 rounded text-blue-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{isAr ? 'معاينة مجانية' : 'Free preview'}</span>
            </label>
          </div>

          {/* Advanced toggle */}
          <button type="button" onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {isAr ? (showAdvanced ? 'إخفاء الخيارات المتقدمة' : 'خيارات متقدمة') : (showAdvanced ? 'Hide advanced options' : 'Advanced options')}
          </button>

          {/* Advanced section */}
          {showAdvanced && (
            <div className="space-y-4 pt-2 border-t border-gray-200 dark:border-gray-700">
              {/* Reminder (live only) */}
              {isLiveCourse && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{isAr ? 'التذكير قبل (دقائق)' : 'Reminder before (minutes)'}</label>
                  <input type="number" min={0} value={form.reminderMinutesBefore}
                    onChange={(e) => setForm((p) => ({ ...p, reminderMinutesBefore: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              )}

              {/* Google Drive Links */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{isAr ? 'روابط Google Drive' : 'Google Drive Materials'}</label>
                  <button type="button" onClick={addDriveLink}
                    className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                    <Plus className="w-3 h-3" />{isAr ? 'إضافة رابط' : 'Add link'}
                  </button>
                </div>
                {form.googleDriveLinks.length === 0 && (
                  <p className="text-xs text-gray-400 dark:text-gray-500">{isAr ? 'لا توجد روابط بعد' : 'No links added yet'}</p>
                )}
                {form.googleDriveLinks.map((link, i) => (
                  <div key={i} className="mb-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{isAr ? `رابط ${i + 1}` : `Link ${i + 1}`}</span>
                      <button type="button" onClick={() => removeDriveLink(i)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <input type="url" value={link.url} onChange={(e) => updateDriveLink(i, 'url', e.target.value)}
                      placeholder="https://drive.google.com/..."
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                    <select value={link.type} onChange={(e) => updateDriveLink(i, 'type', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white">
                      <option value="file">File</option>
                      <option value="folder">Folder</option>
                      <option value="document">Document</option>
                      <option value="spreadsheet">Spreadsheet</option>
                      <option value="presentation">Presentation</option>
                    </select>
                    <input type="text" value={link.name.en} onChange={(e) => updateDriveLinkName(i, 'en', e.target.value)}
                      placeholder={isAr ? 'اسم الملف (إنجليزي)' : 'File name (English)'}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                    <input type="text" dir="rtl" value={link.name.ar} onChange={(e) => updateDriveLinkName(i, 'ar', e.target.value)}
                      placeholder="اسم الملف (عربي)"
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isEditing ? (isAr ? 'حفظ التغييرات' : 'Save Changes') : (isAr ? 'إضافة الدرس' : 'Add Lesson')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
