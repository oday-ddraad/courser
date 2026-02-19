'use client';

import { useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { X, Loader2, BookOpen, Clock, CheckCircle, Phone, MapPin, FileText, Download, Check, X as XIcon } from 'lucide-react';
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
  // New profile fields
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  phoneVerified?: string | null;
  whatsappConsent?: boolean;
  whatsappConsentAt?: string | null;
  profileCompleted?: boolean;
  profileCompletedAt?: string | null;
  emailVerified?: string | null;

  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  documents?: {
    _id: string;
    name: string;
    uploadId: string;
    fileType: string;
    uploadedAt: string;
  }[];
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
  const [downloadingDoc, setDownloadingDoc] = useState<string | null>(null);

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

  const handleDownloadDocument = async (uploadId: string, fileName: string) => {
    setDownloadingDoc(uploadId);
    try {
      const response = await fetch(`/api/file/${uploadId}`);
      if (!response.ok) {
        throw new Error('Failed to download document');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document');
    } finally {
      setDownloadingDoc(null);
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

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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
          {/* User Header */}
          <div className="flex items-start gap-4">
            {user.avatar ? (
              <Image
                src={user.avatar}
                alt={user.name}
                width={80}
                height={80}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <span className="text-2xl text-gray-500 dark:text-gray-400">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {user.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  user.isActive 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {user.isActive ? t('active') : t('inactive')}
                </span>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {t(`roles.${user.role}`)}
                </span>
                {user.emailVerified && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    {t('emailVerified')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Profile Completion Status */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {t('profileCompleted')}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {user.profileCompleted 
                    ? `${t('completedAt')}: ${formatDate(user.profileCompletedAt)}`
                    : t('profileIncomplete')
                  }
                </p>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                user.profileCompleted 
                  ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                  : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400'
              }`}>
                {user.profileCompleted ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <Clock className="w-6 h-6" />
                )}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                {t('contactInfo')}
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('phoneNumber')}:</span>
                  <span className="text-gray-900 dark:text-white">
                    {user.phoneNumber || t('notProvided')}
                  </span>
                </div>
                {user.phoneNumber && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{t('phoneVerified')}:</span>
                    <span className={user.phoneVerified ? 'text-green-600' : 'text-yellow-600'}>
                      {user.phoneVerified ? t('verified') : t('notVerified')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('whatsappConsent')}:</span>
                  <span className={user.whatsappConsent ? 'text-green-600' : 'text-gray-500'}>
                    {user.whatsappConsent ? (
                      <span className="flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        {t('consented')}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <XIcon className="w-3 h-3" />
                        {t('notConsented')}
                      </span>
                    )}
                  </span>
                </div>
                {user.whatsappConsent && user.whatsappConsentAt && (
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{t('consentDate')}:</span>
                    <span>{formatDate(user.whatsappConsentAt)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Address */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {t('address')}
              </h4>
              <div className="space-y-1 text-sm">
                {user.address?.street ? (
                  <>
                    <p className="text-gray-900 dark:text-white">{user.address.street}</p>
                    <p className="text-gray-900 dark:text-white">
                      {user.address.city}, {user.address.state} {user.address.zipCode}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">{user.country}</p>
                  </>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">{t('notProvided')}</p>
                )}
              </div>
            </div>
          </div>

          {/* Documents Section */}
          {user.documents && user.documents.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {t('documents')} ({user.documents.length})
              </h4>
              <div className="space-y-2">
                {user.documents.map((doc) => (
                  <div 
                    key={doc._id} 
                    className="flex items-center justify-between bg-white dark:bg-gray-600 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {doc.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {doc.fileType.toUpperCase()} • {formatDate(doc.uploadedAt)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownloadDocument(doc.uploadId, doc.name)}
                      disabled={downloadingDoc === doc.uploadId}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {downloadingDoc === doc.uploadId ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      {downloadingDoc === doc.uploadId ? '...' : t('download')}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructor Profile */}
          {user.instructorProfile && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">
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
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('specializations')}:</p>
                  <div className="flex flex-wrap gap-2">
                    {user.instructorProfile.specialization.map((spec, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs rounded-full"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Enrolled Courses */}
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">
              {t('enrolledCourses')}
            </h4>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
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
                    className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
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

          {/* Footer Info */}
          <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
            <span>{t('joined')}: {new Date(user.createdAt).toLocaleDateString(locale)}</span>
            <span>{t('lastUpdated')}: {new Date(user.updatedAt).toLocaleDateString(locale)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
