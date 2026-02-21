'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { CourseLevel } from '@/types/database';

interface Category {
  _id: string;
  name: {
    en: string;
    de: string;
    ar: string;
  };
  slug: string;
}


interface CourseCreationWizardProps {
  locale: string;
  userRole: 'admin' | 'instructor';
}

interface MultilingualContent {
  en: string;
  de: string;
  ar: string;
}

interface LessonData {
  id: string;
  title: MultilingualContent;
  description: MultilingualContent;
  youtubeUrl: string;
  duration: number; // in minutes
  googleDriveLinks: {
    name: MultilingualContent;
    url: string;
    type: 'folder' | 'file' | 'document' | 'spreadsheet' | 'presentation';
  }[];
  isPublished: boolean;
}


interface FormData {
  slug: string;
  title: MultilingualContent;
  description: MultilingualContent;
  content: MultilingualContent;
  category: string;
  level: CourseLevel;
  courseType: 'live' | 'uploaded';
  thumbnail: string;
  lessons: LessonData[];
  price: number;
  currency: 'SYP' | 'USD';
  priceSypNew: number; // New SYP (without last two zeros)
  duration: number; // in hours
}



export default function CourseCreationWizard({ locale, userRole }: CourseCreationWizardProps) {
  const router = useRouter();
  const t = useTranslations('courses');
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [activeLangTab, setActiveLangTab] = useState<'en' | 'de' | 'ar'>('en');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  
  const [formData, setFormData] = useState<FormData>({
    slug: '',
    title: { en: '', de: '', ar: '' },
    description: { en: '', de: '', ar: '' },
    content: { en: '', de: '', ar: '' },
    category: '',
    level: 'beginner',
    courseType: 'uploaded',
    thumbnail: '',
    lessons: [],
    price: 0,
    currency: 'SYP',
    priceSypNew: 0,
    duration: 0,
  });



  const languages = [
    { code: 'en', name: 'English', nameAr: 'الإنجليزية' },
    { code: 'de', name: 'Deutsch', nameAr: 'الألمانية' },
    { code: 'ar', name: 'العربية', nameAr: 'العربية' },
  ] as const;

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/courses/categories');
        const data = await response.json();
        if (data.success) {
          setCategories(data.data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const steps = [

    { number: 1, title: 'Basic Info', titleAr: 'المعلومات الأساسية' },
    { number: 2, title: 'Course Type', titleAr: 'نوع الدورة' },
    { number: 3, title: 'Lessons', titleAr: 'الدروس' },
    { number: 4, title: 'Review', titleAr: 'مراجعة' },
  ];

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

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
  };

  const addLesson = () => {
    const newLesson: LessonData = {
      id: Date.now().toString(),
      title: { en: '', de: '', ar: '' },
      description: { en: '', de: '', ar: '' },
      youtubeUrl: '',
      duration: 0,
      googleDriveLinks: [],
      isPublished: false,
    };
    setFormData(prev => ({
      ...prev,
      lessons: [...prev.lessons, newLesson]
    }));
  };


  const updateLesson = (lessonId: string, field: keyof LessonData, value: any) => {
    setFormData(prev => ({
      ...prev,
      lessons: prev.lessons.map(lesson => 
        lesson.id === lessonId ? { ...lesson, [field]: value } : lesson
      )
    }));
  };

  const updateLessonTitle = (lessonId: string, lang: 'en' | 'de' | 'ar', value: string) => {
    setFormData(prev => ({
      ...prev,
      lessons: prev.lessons.map(lesson => 
        lesson.id === lessonId 
          ? { ...lesson, title: { ...lesson.title, [lang]: value } }
          : lesson
      )
    }));
  };

  const updateLessonDescription = (lessonId: string, lang: 'en' | 'de' | 'ar', value: string) => {
    setFormData(prev => ({
      ...prev,
      lessons: prev.lessons.map(lesson => 
        lesson.id === lessonId 
          ? { ...lesson, description: { ...lesson.description, [lang]: value } }
          : lesson
      )
    }));
  };

  const addGoogleDriveLink = (lessonId: string) => {
    setFormData(prev => ({
      ...prev,
      lessons: prev.lessons.map(lesson => 
        lesson.id === lessonId 
          ? { 
              ...lesson, 
              googleDriveLinks: [
                ...lesson.googleDriveLinks, 
                { name: { en: '', de: '', ar: '' }, url: '', type: 'file' }
              ] 
            }
          : lesson
      )
    }));
  };

  const updateGoogleDriveLink = (lessonId: string, linkIndex: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      lessons: prev.lessons.map(lesson => 
        lesson.id === lessonId 
          ? { 
              ...lesson, 
              googleDriveLinks: lesson.googleDriveLinks.map((link, idx) => 
                idx === linkIndex ? { ...link, [field]: value } : link
              )
            }
          : lesson
      )
    }));
  };

  const updateGoogleDriveLinkName = (lessonId: string, linkIndex: number, lang: 'en' | 'de' | 'ar', value: string) => {
    setFormData(prev => ({
      ...prev,
      lessons: prev.lessons.map(lesson => 
        lesson.id === lessonId 
          ? { 
              ...lesson, 
              googleDriveLinks: lesson.googleDriveLinks.map((link, idx) => 
                idx === linkIndex 
                  ? { ...link, name: { ...link.name, [lang]: value } }
                  : link
              )
            }
          : lesson
      )
    }));
  };

  const removeLesson = (lessonId: string) => {
    setFormData(prev => ({
      ...prev,
      lessons: prev.lessons.filter(lesson => lesson.id !== lessonId)
    }));
  };

  const removeGoogleDriveLink = (lessonId: string, linkIndex: number) => {
    setFormData(prev => ({
      ...prev,
      lessons: prev.lessons.map(lesson => 
        lesson.id === lessonId 
          ? { 
              ...lesson, 
              googleDriveLinks: lesson.googleDriveLinks.filter((_, idx) => idx !== linkIndex)
            }
          : lesson
      )
    }));
  };

  const extractYouTubeVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
      /youtube\.com\/watch\?.*v=([^&\s]+)/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };

  const validateStep = (step: number): boolean => {
    setError('');
    
    switch (step) {
      case 1:
        if (!formData.title.en || !formData.description.en) {
          setError('Title and description in English are required');
          return false;
        }
        if (!formData.slug) {
          setError('Course slug is required');
          return false;
        }
        if (!formData.category) {
          setError('Category is required');
          return false;
        }
        return true;
      
      case 2:
        return true;
      
      case 3:
        if (formData.lessons.length === 0) {
          setError('At least one lesson is required');
          return false;
        }
        for (const lesson of formData.lessons) {
          if (!lesson.title.en) {
            setError('All lessons must have a title in English');
            return false;
          }
        }
        return true;
      
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      // Apply multilingual fallback
      const title = { ...formData.title };
      const description = { ...formData.description };
      const content = { ...formData.content };

      // Fallback logic: if a language is empty, use available languages
      ['de', 'ar'].forEach(lang => {
        if (!title[lang as keyof MultilingualContent] || title[lang as keyof MultilingualContent].trim() === '') {
          title[lang as keyof MultilingualContent] = title.en || title.ar || title.de || '';
        }
        if (!description[lang as keyof MultilingualContent] || description[lang as keyof MultilingualContent].trim() === '') {
          description[lang as keyof MultilingualContent] = description.en || description.ar || description.de || '';
        }
        if (!content[lang as keyof MultilingualContent] || content[lang as keyof MultilingualContent].trim() === '') {
          content[lang as keyof MultilingualContent] = content.en || content.ar || content.de || '';
        }
      });

      // Process lessons with YouTube video IDs and fallback
      const processedLessons = formData.lessons.map((lesson, index) => {
        const lessonTitle = { ...lesson.title };
        const lessonDescription = { ...lesson.description };

        ['de', 'ar'].forEach(lang => {
          if (!lessonTitle[lang as keyof MultilingualContent] || lessonTitle[lang as keyof MultilingualContent].trim() === '') {
            lessonTitle[lang as keyof MultilingualContent] = lessonTitle.en || lessonTitle.ar || lessonTitle.de || '';
          }
          if (!lessonDescription[lang as keyof MultilingualContent] || lessonDescription[lang as keyof MultilingualContent].trim() === '') {
            lessonDescription[lang as keyof MultilingualContent] = lessonDescription.en || lessonDescription.ar || lessonDescription.de || '';
          }
        });

        const youtubeVideoId = lesson.youtubeUrl ? extractYouTubeVideoId(lesson.youtubeUrl) : null;

        return {
          order: index + 1,
          title: lessonTitle,
          description: lessonDescription,
          content: { en: '', de: '', ar: '' },
          youtubeVideoId,
          videoUrl: lesson.youtubeUrl,
          duration: lesson.duration || 0,
          isLiveStream: formData.courseType === 'live',

          googleDriveLinks: lesson.googleDriveLinks.map(link => ({
            name: {
              en: link.name.en || link.name.ar || link.name.de || 'Material',
              de: link.name.de || link.name.en || link.name.ar || 'Material',
              ar: link.name.ar || link.name.en || link.name.de || 'المادة',
            },
            url: link.url,
            type: link.type,
          })),
          isPreview: index === 0, // First lesson is preview
          isPublished: lesson.isPublished,
        };
      });

      const courseData = {
        slug: formData.slug,
        title,
        description,
        content,
        category: formData.category,
        level: formData.level,
        courseType: formData.courseType,
        thumbnail: formData.thumbnail,
        lessons: processedLessons,
        price: formData.price,
        currency: formData.currency,
        duration: formData.duration,
      };



      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create course');
      }

      // Redirect to course management or approval page
      if (userRole === 'instructor') {
        router.push(`/${locale}/dashboard/instructor?courseCreated=true`);
      } else {
        router.push(`/${locale}/dashboard/admin/courses?courseCreated=true`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderLanguageTabs = () => (
    <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-gray-700">
      {languages.map((lang) => (
        <button
          key={lang.code}
          type="button"
          onClick={() => setActiveLangTab(lang.code)}
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

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {locale === 'ar' ? 'المعلومات الأساسية' : 'Basic Information'}
        </h2>
        
        {renderLanguageTabs()}

        {/* Course Title */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {locale === 'ar' ? 'عنوان الدورة' : 'Course Title'} ({activeLangTab})
            {activeLangTab === 'en' && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            value={formData.title[activeLangTab]}
            onChange={(e) => handleTitleChange(activeLangTab, e.target.value)}
            onBlur={() => {
              if (activeLangTab === 'en' && formData.title.en && !formData.slug) {
                setFormData(prev => ({ ...prev, slug: generateSlug(formData.title.en) }));
              }
            }}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder={locale === 'ar' ? 'أدخل عنوان الدورة' : 'Enter course title'}
          />
        </div>

        {/* Course Description */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {locale === 'ar' ? 'وصف الدورة' : 'Course Description'} ({activeLangTab})
            {activeLangTab === 'en' && <span className="text-red-500">*</span>}
          </label>
          <textarea
            value={formData.description[activeLangTab]}
            onChange={(e) => handleDescriptionChange(activeLangTab, e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder={locale === 'ar' ? 'أدخل وصف الدورة' : 'Enter course description'}
          />
        </div>

        {/* Course Content */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {locale === 'ar' ? 'محتوى الدورة التفصيلي' : 'Detailed Course Content'} ({activeLangTab})
          </label>
          <textarea
            value={formData.content[activeLangTab]}
            onChange={(e) => handleContentChange(activeLangTab, e.target.value)}
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder={locale === 'ar' ? 'أدخل المحتوى التفصيلي للدورة' : 'Enter detailed course content'}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {locale === 'ar' ? 'إعدادات الدورة' : 'Course Settings'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {locale === 'ar' ? 'معرف الدورة (Slug)' : 'Course Slug'} *
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="course-name-123"
            />
            <p className="text-xs text-gray-500 mt-1">
              {locale === 'ar' ? 'يستخدم في رابط الدورة' : 'Used in course URL'}
            </p>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {locale === 'ar' ? 'الفئة' : 'Category'} *
            </label>
            {loadingCategories ? (
              <div className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500">
                {locale === 'ar' ? 'جاري تحميل الفئات...' : 'Loading categories...'}
              </div>
            ) : categories.length === 0 ? (
              <div className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500">
                {locale === 'ar' ? 'لا توجد فئات متاحة' : 'No categories available'}
              </div>
            ) : (
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">{locale === 'ar' ? 'اختر فئة' : 'Select a category'}</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat.slug}>
                    {cat.name[locale as keyof typeof cat.name] || cat.name.en}
                  </option>
                ))}
              </select>
            )}
          </div>


          {/* Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {locale === 'ar' ? 'المستوى' : 'Level'}
            </label>
            <select
              value={formData.level}
              onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value as CourseLevel }))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="beginner">{locale === 'ar' ? 'مبتدئ' : 'Beginner'}</option>
              <option value="intermediate">{locale === 'ar' ? 'متوسط' : 'Intermediate'}</option>
              <option value="advanced">{locale === 'ar' ? 'متقدم' : 'Advanced'}</option>
            </select>
          </div>

          {/* Thumbnail URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {locale === 'ar' ? 'رابط الصورة المصغرة' : 'Thumbnail URL'}
            </label>
            <input
              type="url"
              value={formData.thumbnail}
              onChange={(e) => setFormData(prev => ({ ...prev, thumbnail: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {locale === 'ar' ? 'مدة الدورة (بالساعات)' : 'Course Duration (hours)'} *
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={formData.duration}
              onChange={(e) => setFormData(prev => ({ ...prev, duration: parseFloat(e.target.value) || 0 }))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="0"
            />
            <p className="text-xs text-gray-500 mt-1">
              {locale === 'ar' ? 'أدخل المدة بالساعات (مثال: 10 أو 10.5)' : 'Enter duration in hours (e.g., 10 or 10.5)'}
            </p>
          </div>
        </div>


        {/* Price Section */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {locale === 'ar' ? 'السعر' : 'Course Price'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Currency Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {locale === 'ar' ? 'العملة' : 'Currency'} *
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value as 'SYP' | 'USD' }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="SYP">{locale === 'ar' ? 'ليرة سورية (جديدة)' : 'SYP (New)'}</option>
                <option value="USD">{locale === 'ar' ? 'دولار أمريكي' : 'USD'}</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {locale === 'ar' ? 'العملة الرئيسية: ليرة سورية (جديدة)' : 'Main currency: SYP (New)'}
              </p>
            </div>

            {/* Price Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {formData.currency === 'SYP' 
                  ? (locale === 'ar' ? 'السعر (ليرة سورية جديدة)' : 'Price (SYP New)')
                  : (locale === 'ar' ? 'السعر (دولار)' : 'Price (USD)')
                } *
              </label>
              <input
                type="number"
                min="0"
                step={formData.currency === 'SYP' ? '1' : '0.01'}
                value={formData.currency === 'SYP' ? formData.priceSypNew : formData.price}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  if (formData.currency === 'SYP') {
                    // New SYP: store as entered (without last two zeros)
                    setFormData(prev => ({ 
                      ...prev, 
                      priceSypNew: value,
                      price: value * 100 // Convert to old SYP for storage
                    }));
                  } else {
                    setFormData(prev => ({ ...prev, price: value }));
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="0"
              />
              {formData.currency === 'SYP' && (
                <p className="text-xs text-gray-500 mt-1">
                  {locale === 'ar' 
                    ? `السعر القديم: ${formData.price} ل.س (مع صفرين إضافيين)`
                    : `Old SYP: ${formData.price} (with two extra zeros)`
                  }
                </p>
              )}
            </div>

            {/* Price Display */}
            <div className="flex items-end">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 w-full">
                <p className="text-sm text-blue-900 dark:text-blue-300 font-medium">
                  {locale === 'ar' ? 'السعر النهائي:' : 'Final Price:'}
                </p>
                <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
                  {formData.currency === 'SYP' 
                    ? `${formData.priceSypNew.toLocaleString()} ${locale === 'ar' ? 'ل.س (جديدة)' : 'SYP (New)'}`
                    : `$${formData.price.toFixed(2)}`
                  }
                </p>
                {formData.currency === 'SYP' && (
                  <p className="text-xs text-blue-600 dark:text-blue-500">
                    = {formData.price.toLocaleString()} {locale === 'ar' ? 'ل.س قديمة' : 'old SYP'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );


  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {locale === 'ar' ? 'نوع الدورة' : 'Course Type'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <label className={`
            flex flex-col items-center p-6 border-2 rounded-xl cursor-pointer transition-all
            ${formData.courseType === 'live' 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }
          `}>
            <input
              type="radio"
              name="courseType"
              value="live"
              checked={formData.courseType === 'live'}
              onChange={(e) => setFormData(prev => ({ ...prev, courseType: e.target.value as 'live' | 'uploaded' }))}
              className="sr-only"
            />
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {locale === 'ar' ? 'دورة مباشرة' : 'Live Course'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              {locale === 'ar' 
                ? 'دروس مباشرة مع الطلاب عبر Jitsi' 
                : 'Live sessions with students via Jitsi'}
            </p>
          </label>

          <label className={`
            flex flex-col items-center p-6 border-2 rounded-xl cursor-pointer transition-all
            ${formData.courseType === 'uploaded' 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }
          `}>
            <input
              type="radio"
              name="courseType"
              value="uploaded"
              checked={formData.courseType === 'uploaded'}
              onChange={(e) => setFormData(prev => ({ ...prev, courseType: e.target.value as 'live' | 'uploaded' }))}
              className="sr-only"
            />
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {locale === 'ar' ? 'دورة مسجلة' : 'Pre-recorded Course'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              {locale === 'ar' 
                ? 'دروس مسجلة على YouTube مع مواد Google Drive' 
                : 'Recorded lessons on YouTube with Google Drive materials'}
            </p>
          </label>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-2">
          {locale === 'ar' ? 'معلومات' : 'Information'}
        </h3>
        <p className="text-sm text-blue-800 dark:text-blue-400">
          {formData.courseType === 'live' 
            ? (locale === 'ar' 
                ? 'سيتم إنشاء مجموعة افتراضية (GROUP A) لجميع الطلاب المسجلين. يمكنك إضافة المزيد من المجموعات لاحقًا.'
                : 'A default group (GROUP A) will be created for all enrolled students. You can add more groups later.')
            : (locale === 'ar'
                ? 'يمكنك إضافة الدروس الآن أو لاحقًا. سيتم إنشاء GROUP A تلقائيًا.'
                : 'You can add lessons now or later. GROUP A will be created automatically.')
          }
        </p>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {locale === 'ar' ? 'الدروس' : 'Lessons'}
          </h2>
          <button
            type="button"
            onClick={addLesson}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {locale === 'ar' ? 'إضافة درس' : 'Add Lesson'}
          </button>
        </div>

        {formData.lessons.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl">
            <p className="text-gray-500 dark:text-gray-400">
              {locale === 'ar' ? 'لا توجد دروس. انقر على "إضافة درس" لبدء الإضافة.' : 'No lessons yet. Click "Add Lesson" to get started.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {formData.lessons.map((lesson, index) => (
              <div key={lesson.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {locale === 'ar' ? `الدرس ${index + 1}` : `Lesson ${index + 1}`}
                  </h3>
                  <button
                    type="button"
                    onClick={() => removeLesson(lesson.id)}
                    className="text-red-600 hover:text-red-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                {renderLanguageTabs()}

                {/* Lesson Title */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {locale === 'ar' ? 'عنوان الدرس' : 'Lesson Title'} ({activeLangTab})
                    {activeLangTab === 'en' && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    value={lesson.title[activeLangTab]}
                    onChange={(e) => updateLessonTitle(lesson.id, activeLangTab, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder={locale === 'ar' ? 'أدخل عنوان الدرس' : 'Enter lesson title'}
                  />
                </div>

                {/* Lesson Description */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {locale === 'ar' ? 'وصف الدرس' : 'Lesson Description'} ({activeLangTab})
                  </label>
                  <textarea
                    value={lesson.description[activeLangTab]}
                    onChange={(e) => updateLessonDescription(lesson.id, activeLangTab, e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder={locale === 'ar' ? 'أدخل وصف الدرس' : 'Enter lesson description'}
                  />
                </div>

                {/* YouTube URL */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {locale === 'ar' ? 'رابط فيديو YouTube (غير مدرج)' : 'YouTube Video URL (Unlisted)'}
                  </label>
                  <input
                    type="url"
                    value={lesson.youtubeUrl}
                    onChange={(e) => updateLesson(lesson.id, 'youtubeUrl', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="https://youtube.com/watch?v=..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {locale === 'ar' 
                      ? 'سيتم استخدام youtube-nocookie.com للخصوصية' 
                      : 'Will use youtube-nocookie.com for privacy'}
                  </p>
                </div>

                {/* Lesson Duration */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {locale === 'ar' ? 'مدة الدرس (بالدقائق)' : 'Lesson Duration (minutes)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={lesson.duration}
                    onChange={(e) => updateLesson(lesson.id, 'duration', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {locale === 'ar' 
                      ? 'أدخل مدة الفيديو بالدقائق (مثال: 45)' 
                      : 'Enter video duration in minutes (e.g., 45)'}
                  </p>
                </div>


                {/* Google Drive Links */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {locale === 'ar' ? 'روابط Google Drive' : 'Google Drive Links'}
                    </label>
                    <button
                      type="button"
                      onClick={() => addGoogleDriveLink(lesson.id)}
                      className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      + {locale === 'ar' ? 'إضافة رابط' : 'Add Link'}
                    </button>
                  </div>
                  
                  {lesson.googleDriveLinks.map((link, linkIndex) => (
                    <div key={linkIndex} className="flex gap-2 mb-2">
                      <input
                        type="url"
                        value={link.url}
                        onChange={(e) => updateGoogleDriveLink(lesson.id, linkIndex, 'url', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        placeholder="https://drive.google.com/..."
                      />
                      <input
                        type="text"
                        value={link.name[activeLangTab]}
                        onChange={(e) => updateGoogleDriveLinkName(lesson.id, linkIndex, activeLangTab, e.target.value)}
                        className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        placeholder={locale === 'ar' ? 'الاسم' : 'Name'}
                      />
                      <select
                        value={link.type}
                        onChange={(e) => updateGoogleDriveLink(lesson.id, linkIndex, 'type', e.target.value)}
                        className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      >
                        <option value="file">{locale === 'ar' ? 'ملف' : 'File'}</option>
                        <option value="folder">{locale === 'ar' ? 'مجلد' : 'Folder'}</option>
                        <option value="document">{locale === 'ar' ? 'مستند' : 'Doc'}</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => removeGoogleDriveLink(lesson.id, linkIndex)}
                        className="text-red-600 hover:text-red-700 transition-colors px-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Publish Toggle */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={lesson.isPublished}
                    onChange={(e) => updateLesson(lesson.id, 'isPublished', e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">
                    {locale === 'ar' ? 'نشر هذا الدرس فورًا' : 'Publish this lesson immediately'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {locale === 'ar' ? 'مراجعة الدورة' : 'Review Course'}
        </h2>

        {/* Course Summary */}
        <div className="space-y-4 mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              {locale === 'ar' ? 'عنوان الدورة' : 'Course Title'}
            </h3>
            <p className="text-gray-700 dark:text-gray-300">{formData.title.en}</p>
            {formData.title.ar && <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{formData.title.ar}</p>}
          </div>

          <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              {locale === 'ar' ? 'نوع الدورة' : 'Course Type'}
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              {formData.courseType === 'live' 
                ? (locale === 'ar' ? 'دورة مباشرة' : 'Live Course')
                : (locale === 'ar' ? 'دورة مسجلة' : 'Pre-recorded Course')
              }
            </p>
          </div>

          <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              {locale === 'ar' ? 'عدد الدروس' : 'Number of Lessons'}
            </h3>
            <p className="text-gray-700 dark:text-gray-300">{formData.lessons.length}</p>
          </div>

          <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              {locale === 'ar' ? 'السعر' : 'Price'}
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              {formData.currency === 'SYP' 
                ? `${formData.priceSypNew.toLocaleString()} ${locale === 'ar' ? 'ل.س (جديدة)' : 'SYP (New)'}`
                : `$${formData.price.toFixed(2)} USD`
              }
            </p>
            {formData.currency === 'SYP' && (
              <p className="text-sm text-gray-500">
                {formData.price.toLocaleString()} {locale === 'ar' ? 'ل.س قديمة' : 'old SYP'}
              </p>
            )}
          </div>

          <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              {locale === 'ar' ? 'المدة' : 'Duration'}
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              {formData.duration} {locale === 'ar' ? 'ساعة' : 'hours'}
            </p>
          </div>
        </div>



        {/* Approval Notice */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h4 className="font-semibold text-yellow-900 dark:text-yellow-300 mb-1">
                {locale === 'ar' ? 'ملاحظة حول الموافقة' : 'Approval Notice'}
              </h4>
              <p className="text-sm text-yellow-800 dark:text-yellow-400">
                {userRole === 'instructor'
                  ? (locale === 'ar' 
                      ? 'كمدرس، سيتم إرسال دورتك للمسؤول للموافقة عليها قبل النشر. سيتم إخطارك عند الموافقة.'
                      : 'As an instructor, your course will be sent to an admin for approval before publishing. You will be notified when approved.')
                  : (locale === 'ar'
                      ? 'كمسؤول، سيتم نشر هذه الدورة مباشرة.'
                      : 'As an admin, this course will be published immediately.')
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center">
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
            ${currentStep >= step.number
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }
          `}>
            {step.number}
          </div>
          <span className={`
            ml-2 text-sm font-medium hidden sm:block
            ${currentStep >= step.number
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-500 dark:text-gray-400'
            }
          `}>
            {locale === 'ar' ? step.titleAr : step.title}
          </span>
          {index < steps.length - 1 && (
            <div className={`
              w-12 sm:w-20 h-1 mx-2 sm:mx-4
              ${currentStep > step.number
                ? 'bg-blue-600'
                : 'bg-gray-200 dark:bg-gray-700'
              }
            `} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-4">
      {renderStepIndicator()}

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); if (currentStep === 4) handleSubmit(); }}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`
              px-6 py-3 rounded-lg font-medium transition-colors
              ${currentStep === 1
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }
            `}
          >
            {locale === 'ar' ? 'السابق' : 'Previous'}
          </button>

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                nextStep();
              }}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              {locale === 'ar' ? 'التالي' : 'Next'}
            </button>
          ) : (

            <button
              type="submit"
              disabled={isSubmitting}
              className={`
                px-6 py-3 rounded-lg font-medium transition-colors
                ${isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
                }
              `}
            >
              {isSubmitting
                ? (locale === 'ar' ? 'جاري الإنشاء...' : 'Creating...')
                : (locale === 'ar' ? 'إنشاء الدورة' : 'Create Course')
              }
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
