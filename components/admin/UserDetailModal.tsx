'use client';

import { useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { X, Loader2, BookOpen, Clock, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'instructor' | 'user';
  locale: 'en' | 'de' | 'ar';
  country: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  instructorProfile?: {
    bio: { en: string; de: string; ar: string };
    specialization: string[];
    rating: number;
    totalStudents: number;
    totalCourses: number;
  };
}

interface Enrollment {
  _id: string;
  courseId: {
    _id: string;
    title: { en: string; de: string; ar: string };
    slug: string;
    thumbnail?: string;
    price: number;
    currency: string;
    level: string;
    duration: number;
  } | null;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  progress: number;
  enrolledAt: string;
  completedAt?: string;
}

interface UserDetailModalProps {
  user: User;
  onClose: () => void;
}

export default function UserDetailModal({ user, onClose }: UserDetailModalProps) {
  const locale = useLocale();
  const t = useTranslations('admin.users');
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUserDetails();
  }, [user._id]);

  const fetchUserDetails = async () => {
    try {
      const response = await fetch(`/api/users/${user._id}`);
      const data = await response.json();
      
      if (data.success) {
        setEnrollments(data.data.enrollments || []);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {t('userDetails')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* User Info */}
          <div className="flex items-start gap-4">
            {user.avatar ? (
              <Image
                src={user.avatar}
                alt={user.name}
                width={80}
                height={80}
                className="rounded-full"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <span className="text-2xl text-blue-600 dark:text-blue-300 font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {user.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  user.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                  user.role === 'instructor' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                }`}>
                  {t(`roles.${user.role}`)}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  user.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {user.isActive ? t('active') : t('inactive')}
                </span>
              </div>
            </div>
          </div>

          {/* User Details Grid */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('locale')}</p>
              <p className="font-medium text-gray-900 dark:text-white uppercase">{user.locale}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('country')}</p>
              <p className="font-medium text-gray-900 dark:text-white">{user.country}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('joined')}</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {new Date(user.createdAt).toLocaleDateString(locale)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('lastUpdated')}</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {new Date(user.updatedAt).toLocaleDateString(locale)}
              </p>
            </div>
          </div>

          {/* Instructor Profile */}
          {user.role === 'instructor' && user.instructorProfile && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-bold text-gray-900 dark:text-white mb-3">
                {t('instructorProfile')}
              </h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {user.instructorProfile.rating.toFixed(1)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('rating')}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {user.instructorProfile.totalStudents}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('students')}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {user.instructorProfile.totalCourses}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('courses')}</p>
                </div>
              </div>
              {user.instructorProfile.specialization.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('specializations')}</p>
                  <div className="flex flex-wrap gap-1">
                    {user.instructorProfile.specialization.map((spec, idx) => (
                      <span key={idx} className="px-2 py-1 bg-white dark:bg-gray-700 rounded text-xs">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Enrollments */}
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              {t('enrolledCourses')} ({enrollments.length})
            </h4>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : enrollments.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                {t('noEnrollments')}
              </p>
            ) : (
              <div className="space-y-3">
                {enrollments.map((enrollment) => (
                  <div 
                    key={enrollment._id}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    {enrollment.courseId?.thumbnail ? (
                      <Image
                        src={enrollment.courseId.thumbnail}
                        alt={enrollment.courseId.title[locale as keyof typeof enrollment.courseId.title] || enrollment.courseId.title.en}
                        width={60}
                        height={40}
                        className="rounded object-cover"
                      />
                    ) : (
                      <div className="w-[60px] h-[40px] bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {enrollment.courseId ? (
                          <Link 
                            href={`/${locale}/courses/${enrollment.courseId.slug}`}
                            className="hover:text-blue-600 dark:hover:text-blue-400"
                          >
                            {enrollment.courseId.title[locale as 'en' | 'de' | 'ar'] || enrollment.courseId.title.en}
                          </Link>
                        ) : (
                          t('deletedCourse')
                        )}
                      </p>

                      <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(enrollment.enrolledAt).toLocaleDateString(locale)}
                        </span>
                        {enrollment.progress > 0 && (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            {enrollment.progress}%
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(enrollment.status)}`}>
                      {t(`enrollmentStatus.${enrollment.status}`)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
