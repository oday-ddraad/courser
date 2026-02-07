'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { CourseLevel } from '@/types/database';

interface CourseCreationFormProps {
  locale: string;
}

interface FormData {
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
  content: {
    en: string;
    de: string;
    ar: string;
  };
  category: string;
  level: CourseLevel;
  price: number;
  currency: string;
  duration: number;
  isLiveStream: boolean;
  isPublished: boolean;
}

export default function CourseCreationForm({ locale }: CourseCreationFormProps) {
  const router = useRouter();
  const t = useTranslations('courses');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'en' | 'de' | 'ar'>('en');
  
  const [formData, setFormData] = useState<FormData>({
    title: { en: '', de: '', ar: '' },
    description: { en: '', de: '', ar: '' },
    content: { en: '', de: '', ar: '' },
    category: '',
    level: 'beginner',
    price: 0,
    currency: 'USD',
    duration: 0,
    isLiveStream: false,
    isPublished: false,
  });

  const handleTitleChange = (lang: 'en' | 'de' | 'ar', value: string) => {
    setFormData(prev => ({
      ...prev,
      title: { ...prev.title, [lang]: value }
    }));
  };

  const handleDescriptionChange = (lang: 'en' | 'de' | 'ar', value: string) => {
    setFormData(prev => ({
      ...prev,
      description: { ...prev.description, [lang]: value }
    }));
  };

  const handleContentChange = (lang: 'en' | 'de' | 'ar', value: string) => {
    setFormData(prev => ({
      ...prev,
      content: { ...prev.content, [lang]: value }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create course');
      }

      router.push(`/${locale}/courses/${data.data.slug}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'de', name: 'Deutsch' },
    { code: 'ar', name: 'العربية' },
  ] as const;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Language Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Course Content (Multi-language)
        </h2>
        
        <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-gray-700">
          {languages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => setActiveTab(lang.code)}
              className={`
                px-4 py-2 font-medium transition-colors
                ${activeTab === lang.code
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              {lang.name}
            </button>
          ))}
        </div>

        {/* Title */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Title ({activeTab})
          </label>
          <input
            type="text"
            value={formData.title[activeTab]}
            onChange={(e) => handleTitleChange(activeTab, e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required={activeTab === 'en'}
            placeholder={`Course title in ${languages.find(l => l.code === activeTab)?.name}`}
          />
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description ({activeTab})
          </label>
          <textarea
            value={formData.description[activeTab]}
            onChange={(e) => handleDescriptionChange(activeTab, e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required={activeTab === 'en'}
            placeholder={`Course description in ${languages.find(l => l.code === activeTab)?.name}`}
          />
        </div>

        {/* Content */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Full Content ({activeTab})
          </label>
          <textarea
            value={formData.content[activeTab]}
            onChange={(e) => handleContentChange(activeTab, e.target.value)}
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder={`Detailed course content in ${languages.find(l => l.code === activeTab)?.name}`}
          />
        </div>
      </div>

      {/* Course Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Course Settings
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
              placeholder="e.g., Programming, Language, Business"
            />
          </div>

          {/* Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Level
            </label>
            <select
              value={formData.level}
              onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value as CourseLevel }))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Price
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
              <select
                value={formData.currency}
                onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                className="w-24 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Duration (hours)
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={formData.duration}
              onChange={(e) => setFormData(prev => ({ ...prev, duration: parseFloat(e.target.value) }))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>
        </div>

        {/* Checkboxes */}
        <div className="mt-6 space-y-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={formData.isLiveStream}
              onChange={(e) => setFormData(prev => ({ ...prev, isLiveStream: e.target.checked }))}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700 dark:text-gray-300">
              This course includes live streaming sessions
            </span>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={formData.isPublished}
              onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700 dark:text-gray-300">
              Publish immediately
            </span>
          </label>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Creating...' : 'Create Course'}
        </button>
        
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
