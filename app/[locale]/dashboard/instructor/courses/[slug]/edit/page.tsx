'use client';

import { useSession } from 'next-auth/react';
import { redirect, useParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useState, useEffect } from 'react';
import { 
  Save, 
  ArrowLeft, 
  Loader2,
  Check,
  X,
  Send
} from 'lucide-react';
import Link from 'next/link';

interface Course {
  _id: string;
  slug: string;
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
  instructorIds: string[];
  level: string;
  category: string;
  price: number;
  currency: string;
  duration: number;
  courseType: 'live' | 'uploaded';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  isPublished: boolean;
  thumbnail: string;
  rejectionReason?: string;
}

interface Category {
  _id: string;
  name: { en: string; de: string; ar: string };
  slug: string;
}

export default function InstructorEditCoursePage() {
  const { data: session, status } = useSession();
  const t = useTranslations('Dashboard.instructor.courses');
  const locale = useLocale();
  const params = useParams();
  const slug = params.slug as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    titleEn: '',
    titleDe: '',
    titleAr: '',
    descriptionEn: '',
    descriptionDe: '',
    descriptionAr: '',
    level: 'beginner',
    category: '',
    price: 0,
    currency: 'USD',
    duration: 0,
    courseType: 'uploaded' as 'live' | 'uploaded',
    isPublished: false,
    thumbnail: '',
  });

  useEffect(() => {
    if (status !== 'loading' && session) {
      fetchCourse();
      fetchCategories();
    }
  }, [slug, status, session]);

  if (status === 'loading') {
    return <div className="p-6">Loading...</div>;
  }

  if (!session || session.user.role !== 'instructor') {
    redirect('/forbidden');
  }

  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/courses?slug=${slug}&myCourses=true`);
      const data = await response.json();
      
      if (data.success && data.data.length > 0) {
        const courseData = data.data[0];
        setCourse(courseData);
        setFormData({
          titleEn: courseData.title?.en || '',
          titleDe: courseData.title?.de || '',
          titleAr: courseData.title?.ar || '',
          descriptionEn: courseData.description?.en || '',
          descriptionDe: courseData.description?.de || '',
          descriptionAr: courseData.description?.ar || '',
          level: courseData.level || 'beginner',
          category: courseData.category || '',
          price: courseData.price || 0,
          currency: courseData.currency || 'USD',
          duration: courseData.duration || 0,
          courseType: courseData.courseType || 'uploaded',
          isPublished: courseData.isPublished || false,
          thumbnail: courseData.thumbnail || '',
        });
      } else {
        setError('Course not found');
      }
    } catch (err) {
      setError('Failed to fetch course');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/courses/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError('');

    try {
      if (!course) return;

      const response = await fetch(`/api/courses/${course._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: {
            en: formData.titleEn,
            de: formData.titleDe,
            ar: formData.titleAr,
          },
          description: {
            en: formData.descriptionEn,
            de: formData.descriptionDe,
            ar: formData.descriptionAr,
          },
          level: formData.level,
          category: formData.category,
          price: formData.price,
          currency: formData.currency,
          duration: formData.duration,
          courseType: formData.courseType,
          isPublished: formData.isPublished,
          thumbnail: formData.thumbnail,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save course');
      }
    } catch (err) {
      setError('Error saving course');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!course) return;
    
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/courses/${course._id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        setSuccess(true);
        fetchCourse();
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to submit for approval');
      }
    } catch (err) {
      setError('Error submitting for approval');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-6">
        <div className="text-center">
          <X className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {error || 'Course not found'}
          </h2>
          <Link 
            href={`/${locale}/dashboard/instructor/courses`}
            className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to courses
          </Link>
        </div>
      </div>
    );
  }

  const canEdit = course.approvalStatus === 'pending' || course.approvalStatus === 'rejected';
  const isApproved = course.approvalStatus === 'approved';

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link
            href={`/${locale}/dashboard/instructor/courses`}
            className="mr-4 p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('editCourse')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {course.title[locale as keyof typeof course.title] || course.title.en}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {success && (
            <span className="flex items-center text-green-600">
              <Check className="w-4 h-4 mr-1" />
              Saved
            </span>
          )}
          {canEdit && (
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {t('saveChanges')}
            </button>
          )}
        </div>
      </div>

      {/* Status Banner */}
      <div className={`mb-6 p-4 rounded-lg ${
        course.approvalStatus === 'approved' ? 'bg-green-100 dark:bg-green-900/30' :
        course.approvalStatus === 'rejected' ? 'bg-red-100 dark:bg-red-900/30' :
        'bg-yellow-100 dark:bg-yellow-900/30'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`font-medium ${
              course.approvalStatus === 'approved' ? 'text-green-800 dark:text-green-300' :
              course.approvalStatus === 'rejected' ? 'text-red-800 dark:text-red-300' :
              'text-yellow-800 dark:text-yellow-300'
            }`}>
              {course.approvalStatus === 'approved' && (locale === 'ar' ? 'تمت الموافقة على الدورة' : locale === 'de' ? 'Kurs genehmigt' : 'Course Approved')}
              {course.approvalStatus === 'rejected' && (locale === 'ar' ? 'تم رفض الدورة' : locale === 'de' ? 'Kurs abgelehnt' : 'Course Rejected')}
              {course.approvalStatus === 'pending' && (locale === 'ar' ? 'في انتظار الموافقة' : locale === 'de' ? 'Genehmigung ausstehend' : 'Pending Approval')}
            </p>
            {course.rejectionReason && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {locale === 'ar' ? 'السبب: ' : 'Reason: '}{course.rejectionReason}
              </p>
            )}
          </div>
          {canEdit && !isApproved && (
            <button
              onClick={handleSubmitForApproval}
              disabled={submitting}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {locale === 'ar' ? 'إرسال للموافقة' : locale === 'de' ? 'Zur Genehmigung senden' : 'Submit for Approval'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title Section */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('courseTitle')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                English *
              </label>
              <input
                type="text"
                required
                disabled={!canEdit}
                value={formData.titleEn}
                onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                German
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={formData.titleDe}
                onChange={(e) => setFormData({ ...formData, titleDe: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Arabic
              </label>
              <input
                type="text"
                dir="rtl"
                disabled={!canEdit}
                value={formData.titleAr}
                onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Description Section */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('courseDescription')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                English
              </label>
              <textarea
                rows={4}
                disabled={!canEdit}
                value={formData.descriptionEn}
                onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                German
              </label>
              <textarea
                rows={4}
                disabled={!canEdit}
                value={formData.descriptionDe}
                onChange={(e) => setFormData({ ...formData, descriptionDe: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Arabic
              </label>
              <textarea
                rows={4}
                dir="rtl"
                disabled={!canEdit}
                value={formData.descriptionAr}
                onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Course Details */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('courseDetails')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('courseType')}
              </label>
              <select
                disabled={!canEdit}
                value={formData.courseType}
                onChange={(e) => setFormData({ ...formData, courseType: e.target.value as 'live' | 'uploaded' })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white disabled:opacity-50"
              >
                <option value="live">{t('live')}</option>
                <option value="uploaded">{t('uploaded')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('category')}
              </label>
              <select
                disabled={!canEdit}
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white disabled:opacity-50"
              >
                <option value="">{t('selectCategory')}</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat.slug}>
                    {cat.name[locale as keyof typeof cat.name] || cat.name.en}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('level')}
              </label>
              <select
                disabled={!canEdit}
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white disabled:opacity-50"
              >
                <option value="beginner">{t('beginner')}</option>
                <option value="intermediate">{t('intermediate')}</option>
                <option value="advanced">{t('advanced')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('price')}
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  disabled={!canEdit}
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white disabled:opacity-50"
                />
                <select
                  disabled={!canEdit}
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white disabled:opacity-50"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="SYP">SYP</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('duration')} ({t('hours')})
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g., 40"
                disabled={!canEdit}
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('thumbnailUrl')}
              </label>
              <input
                type="url"
                placeholder="https://example.com/image.jpg"
                disabled={!canEdit}
                value={formData.thumbnail}
                onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Publishing - Only for approved courses */}
        {isApproved && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('publishing')}
            </h2>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPublished"
                checked={formData.isPublished}
                onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="isPublished" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                {t('publishCourse')}
              </label>
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {t('publishHelp')}
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
