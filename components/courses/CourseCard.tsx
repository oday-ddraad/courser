'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Star, Clock, Users, BookOpen } from 'lucide-react';
import { ICourse } from '@/lib/mongodb/models';

interface PopulatedInstructor {
  _id: string;
  name: string;
  avatar?: string;
}

interface SerializedCourse {
  _id: string;
  title: { en: string; de: string; ar: string };
  description: { en: string; de: string; ar: string };
  content: { en: string; de: string; ar: string };
  slug: string;
  thumbnail?: string;
  price: number;
  currency: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  category: string;
  tags: string[];
  isPublished: boolean;
  isLiveStream: boolean;
  enrollmentCount: number;
  rating: number;
  instructorIds?: PopulatedInstructor[];
  lessons?: any[];
  reviews?: any[];
}


interface CourseCardProps {
  course: SerializedCourse;
  showEnrolled?: boolean;
}



export default function CourseCard({ course, showEnrolled = false }: CourseCardProps) {
  const locale = useLocale();
  const t = useTranslations('courses');
  
  // Get localized content
  const title = course.title[locale as keyof typeof course.title] || course.title.en;
  const description = course.description[locale as keyof typeof course.description] || course.description.en;
  
  // Format price using translations
  const formatPrice = (price: number, currency: string) => {
    if (price === 0) return t('free');
    
    const currencyKey = currency as 'USD' | 'EUR' | 'SYP';
    const currencyName = t(`currency.${currencyKey}`);
    const formattedAmount = new Intl.NumberFormat(locale).format(price);
    
    return t('price', { amount: formattedAmount, currency: currencyName });
  };

  
  // Format duration
  const formatDuration = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)} ${t('minutes')}`;
    }
    return `${Math.round(hours)} ${t('hours')}`;
  };
  
  return (
    <Link 
      href={`/${locale}/courses/${course.slug}`}
      className="group block bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        {course.thumbnail ? (
          <Image
            src={course.thumbnail}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-white/80" />
          </div>
        )}
        
        {/* Level Badge */}
        <div className="absolute top-3 left-3">
          <span className={`
            px-3 py-1 rounded-full text-xs font-medium
            ${course.level === 'beginner' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
            ${course.level === 'intermediate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : ''}
            ${course.level === 'advanced' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : ''}
          `}>
            {t(`levels.${course.level}`)}
          </span>
        </div>
        
        {/* Live Stream Badge */}
        {course.isLiveStream && (
          <div className="absolute top-3 right-3">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 flex items-center gap-1">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              {t('live')}
            </span>
          </div>
        )}
        
        {/* Enrolled Badge */}
        {showEnrolled && (
          <div className="absolute bottom-3 right-3">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {t('enrolled')}
            </span>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-5">
        {/* Category */}
        <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-2">
          {course.category}
        </p>
        
        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {title}
        </h3>
        
        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
          {description}
        </p>
        
        {/* Instructor - show first instructor from array */}
        {course.instructorIds && course.instructorIds.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            {course.instructorIds[0].avatar ? (
              <Image
                src={course.instructorIds[0].avatar}
                alt={course.instructorIds[0].name}
                width={24}
                height={24}
                className="rounded-full"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {course.instructorIds[0].name?.charAt(0) || '?'}
                </span>
              </div>
            )}
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {course.instructorIds[0].name}
              {course.instructorIds.length > 1 && ` +${course.instructorIds.length - 1}`}
            </span>
          </div>
        )}


        
        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500" />
            <span>{course.rating > 0 ? course.rating.toFixed(1) : '-'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{course.enrollmentCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{formatDuration(course.duration)}</span>
          </div>
        </div>
        
        {/* Price */}
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-gray-900 dark:text-white">
            {formatPrice(course.price, course.currency)}
          </span>
          <span className="text-sm text-blue-600 dark:text-blue-400 font-medium group-hover:underline">
            {t('viewDetails')}
          </span>
        </div>

      </div>
    </Link>
  );
}
