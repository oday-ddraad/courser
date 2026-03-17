'use client';

import { useSession } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useEffect, useState } from 'react';
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  Users, 
  PlayCircle, 
  CheckCircle, 
  AlertCircle,
  ChevronRight,
  GraduationCap,
  Video,
  FileText,
  ArrowRight,
  Loader2
} from 'lucide-react';
import LiveSessionNotification from '@/components/LiveSessionNotification';

interface Enrollment {
  _id: string;
  courseId: {
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
    thumbnail: string;
    level: string;
    duration: number;
    lessons: {
      _id: string;
      title: {
        en: string;
        de: string;
        ar: string;
      };
      duration: number;
      isLiveStream: boolean;
      scheduledDateTime?: string;
      liveStatus?: string;
      order: number;
    }[];
    groups: {
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
      schedule: {
        dayOfWeek: string;
        time: string;
        lessonType: string;
      }[];
      studentIds: string[];
    }[];
  };
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  progress: {
    completedLessons: string[];
    lastAccessedLesson?: string;
    lastAccessedAt?: string;
    completionPercentage: number;
  };
  enrolledAt: string;
  completedAt?: string;
}

export default function UserCoursesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('Dashboard.user');
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'authenticated') {
      fetchEnrollments();
    }
  }, [status]);

  const fetchEnrollments = async () => {
    try {
      const response = await fetch('/api/enrollments');
      if (!response.ok) throw new Error('Failed to fetch enrollments');
      const data = await response.json();
      setEnrollments(data.data || []);
    } catch (err) {
      setError('Failed to load your courses');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!session) {
    redirect('/login');
  }

  const getLocalizedText = (text: { en: string; de: string; ar: string }) => {
    return text[locale as keyof typeof text] || text.en;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getDayName = (day: string) => {
    const days: Record<string, string> = {
      monday: 'Monday',
      tuesday: 'Tuesday',
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday',
      saturday: 'Saturday',
      sunday: 'Sunday',
    };
    return days[day] || day;
  };

  const activeEnrollments = enrollments.filter(e => e.status === 'active');
  const completedEnrollments = enrollments.filter(e => e.status === 'completed');
  const pendingEnrollments = enrollments.filter(e => e.status === 'pending');

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <LiveSessionNotification />
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('myCourses') || 'My Courses'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your enrolled courses, track progress, and view your schedule
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Courses</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{enrollments.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <PlayCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeEnrollments.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <CheckCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedEnrollments.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingEnrollments.length}</p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Active Courses */}
      {activeEnrollments.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-green-600" />
            Active Courses
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activeEnrollments.map((enrollment) => (
              <CourseCard 
                key={enrollment._id} 
                enrollment={enrollment} 
                getLocalizedText={getLocalizedText}
                getStatusColor={getStatusColor}
                getDayName={getDayName}
                locale={locale}
              />
            ))}
          </div>
        </div>
      )}

      {/* Pending Courses */}
      {pendingEnrollments.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            Pending Enrollment
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {pendingEnrollments.map((enrollment) => (
              <CourseCard 
                key={enrollment._id} 
                enrollment={enrollment} 
                getLocalizedText={getLocalizedText}
                getStatusColor={getStatusColor}
                getDayName={getDayName}
                locale={locale}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Courses */}
      {completedEnrollments.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-purple-600" />
            Completed Courses
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {completedEnrollments.map((enrollment) => (
              <CourseCard 
                key={enrollment._id} 
                enrollment={enrollment} 
                getLocalizedText={getLocalizedText}
                getStatusColor={getStatusColor}
                getDayName={getDayName}
                locale={locale}
              />
            ))}
          </div>
        </div>
      )}

      {enrollments.length === 0 && !loading && (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Courses Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You haven't enrolled in any courses yet. Start your learning journey today!
          </p>
          <button
            onClick={() => router.push('/courses')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 mx-auto"
          >
            Browse Courses
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// Course Card Component
function CourseCard({ 
  enrollment, 
  getLocalizedText, 
  getStatusColor,
  getDayName,
  locale 
}: { 
  enrollment: Enrollment;
  getLocalizedText: (text: { en: string; de: string; ar: string }) => string;
  getStatusColor: (status: string) => string;
  getDayName: (day: string) => string;
  locale: string;
}) {
  const router = useRouter();
  const course = enrollment.courseId;
  const totalLessons = course.lessons?.length || 0;
  const completedLessons = enrollment.progress?.completedLessons?.length || 0;
  const progressPercentage = enrollment.progress?.completionPercentage || 0;
  
  // Get upcoming lessons (scheduled and not completed)
  const upcomingLessons = course.lessons?.filter(lesson => 
    lesson.isLiveStream && 
    lesson.scheduledDateTime && 
    new Date(lesson.scheduledDateTime) > new Date() &&
    !enrollment.progress?.completedLessons?.includes(lesson._id)
  ).sort((a, b) => new Date(a.scheduledDateTime!).getTime() - new Date(b.scheduledDateTime!).getTime()) || [];

  // Get next lesson to continue
  const nextLesson = course.lessons?.find(lesson => 
    !enrollment.progress?.completedLessons?.includes(lesson._id)
  );

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Course Header */}
      <div className="relative h-48 bg-gray-200 dark:bg-gray-700">
        {course.thumbnail ? (
          <img 
            src={course.thumbnail} 
            alt={getLocalizedText(course.title)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
            <BookOpen className="w-16 h-16 text-white/50" />
          </div>
        )}
        <div className="absolute top-4 right-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(enrollment.status)}`}>
            {enrollment.status.charAt(0).toUpperCase() + enrollment.status.slice(1)}
          </span>
        </div>
      </div>

      <div className="p-6">
        {/* Title & Description */}
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {getLocalizedText(course.title)}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
          {getLocalizedText(course.description)}
        </p>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400">Progress</span>
            <span className="font-medium text-gray-900 dark:text-white">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {completedLessons} of {totalLessons} lessons completed
          </p>
        </div>

        {/* Course Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4 text-center">
          <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <Video className="w-4 h-4 text-gray-500 mx-auto mb-1" />
            <p className="text-xs text-gray-600 dark:text-gray-400">{totalLessons} Lessons</p>
          </div>
          <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <Clock className="w-4 h-4 text-gray-500 mx-auto mb-1" />
            <p className="text-xs text-gray-600 dark:text-gray-400">{course.duration || 0}h</p>
          </div>
          <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <GraduationCap className="w-4 h-4 text-gray-500 mx-auto mb-1" />
            <p className="text-xs text-gray-600 dark:text-gray-400">{course.level}</p>
          </div>
        </div>

        {/* Group Information */}
        {course.groups && course.groups.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Your Group
            </h4>
            {course.groups.map((group) => (
              <div key={group._id} className="text-sm">
                <p className="font-medium text-gray-800 dark:text-gray-200">
                  {getLocalizedText(group.name)}
                </p>
                {group.schedule && group.schedule.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Schedule:</p>
                    {group.schedule.map((slot, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <Calendar className="w-3 h-3" />
                        {getDayName(slot.dayOfWeek)} at {slot.time}
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          slot.lessonType === 'live' 
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' 
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {slot.lessonType === 'live' ? 'Live' : 'Recorded'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  {group.studentIds?.length || 0} students in group
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Upcoming Live Lessons */}
        {upcomingLessons.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Video className="w-4 h-4 text-red-500" />
              Upcoming Live Sessions
            </h4>
            <div className="space-y-2">
              {upcomingLessons.slice(0, 2).map((lesson) => (
                <div key={lesson._id} className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm">
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    {getLocalizedText(lesson.title)}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {new Date(lesson.scheduledDateTime!).toLocaleString(locale, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              ))}
              {upcomingLessons.length > 2 && (
                <p className="text-xs text-gray-500 text-center">
                  +{upcomingLessons.length - 2} more sessions
                </p>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {enrollment.status === 'active' && nextLesson && (
            <button
              onClick={() => router.push(`/courses/${course.slug}/lessons/${nextLesson._id}`)}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              <PlayCircle className="w-4 h-4" />
              Continue Learning
            </button>
          )}
          <button
            onClick={() => router.push(`/courses/${course.slug}`)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Enrollment Date */}
        <p className="text-xs text-gray-500 mt-3 text-center">
          Enrolled on {new Date(enrollment.enrolledAt).toLocaleDateString(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>
    </div>
  );
}
