'use client';

import { useSession } from 'next-auth/react';
import { redirect, useParams } from 'next/navigation';
import { hasPermission } from '@/lib/auth/permissions';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { 
  Plus, 
  ArrowLeft, 
  Users, 
  Edit, 
  Trash2, 
  X,
  Check,
  UserPlus,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

interface Group {
  _id: string;
  name: string;
  maxStudents: number;
  students: Array<{
    _id: string;
    name: string;
    email: string;
  }>;
  instructor?: {
    _id: string;
    name: string;
    email: string;
  };
  schedule: Array<{
    _id: string;
    dayOfWeek: string;
    time: string;
    lessonType: 'live' | 'recorded';
    lessonId?: string;
    isActive: boolean;
  }>;
  notificationSettings: {
    enabled: boolean;
    earlyMorningEnabled: boolean;
    earlyMorningTime: string;
    oneHourEnabled: boolean;
    notificationTypes: ('email' | 'in_app')[];
    alertType: 'live_lesson' | 'recorded_lesson';
  };
}

interface Course {
  _id: string;
  title: {
    en: string;
    de: string;
    ar: string;
  };
  slug: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export default function CourseGroupsPage() {
  const { data: session, status } = useSession();
  const t = useTranslations('Dashboard.admin.groups');
  const params = useParams();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<User[]>([]);

  const [loading, setLoading] = useState(true);
  const [studentFilter, setStudentFilter] = useState<'all' | 'assigned' | 'unassigned'>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedGroupForAssign, setSelectedGroupForAssign] = useState<Group | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    maxStudents: 20,
    instructor: '',
    schedules: [] as Array<{
      dayOfWeek: string;
      time: string;
      lessonType: 'live' | 'recorded';
      isActive: boolean;
    }>,
    notificationSettings: {
      enabled: true,
      earlyMorningEnabled: true,
      earlyMorningTime: '08:00',
      oneHourEnabled: true,
      notificationTypes: ['email', 'in_app'] as ('email' | 'in_app')[],
      alertType: 'live_lesson' as 'live_lesson' | 'recorded_lesson',
    },
  });

  useEffect(() => {
    if (status !== 'loading' && session && hasPermission(session.user.role, 'course.manage')) {
      fetchCourse();
      fetchGroups();
      fetchEnrollments();
    }
  }, [courseId, status, session]);



  if (status === 'loading') {
    return <div className="p-6">Loading...</div>;
  }

  if (!session || !hasPermission(session.user.role, 'course.manage')) {
    redirect('/forbidden');
  }


  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}`);
      const data = await response.json();
      if (data.success) {
        setCourse(data.data);
      }
    } catch (error) {
      console.error('Error fetching course:', error);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}/groups`);
      const data = await response.json();
      if (data.success) {
        setGroups(data.data);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollments = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}/enrollments?limit=1000`);
      const data = await response.json();
      if (data.success) {
        setEnrollments(data.data.enrollments || []);
        // Extract student data from enrollments
        const students = data.data.enrollments?.map((enrollment: any) => ({
          _id: enrollment.userId?._id || enrollment.userId,
          name: enrollment.userId?.name || 'Unknown',
          email: enrollment.userId?.email || '',
          role: 'user'
        })) || [];
        setEnrolledStudents(students);
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      setEnrollments([]);
      setEnrolledStudents([]);
    }
  };



  const handleOpenModal = (group?: Group) => {
    if (group) {
      setEditingGroup(group);
      setFormData({
        name: group.name,
        maxStudents: group.maxStudents,
        instructor: group.instructor?._id || '',
        schedules: group.schedule.map(s => ({
          dayOfWeek: s.dayOfWeek,
          time: s.time,
          lessonType: s.lessonType,
          isActive: s.isActive,
        })),
        notificationSettings: group.notificationSettings,
      });
    } else {
      setEditingGroup(null);
      setFormData({
        name: '',
        maxStudents: 20,
        instructor: '',
        schedules: [],
        notificationSettings: {
          enabled: true,
          earlyMorningEnabled: true,
          earlyMorningTime: '08:00',
          oneHourEnabled: true,
          notificationTypes: ['email', 'in_app'],
          alertType: 'live_lesson',
        },
      });
    }
    setIsModalOpen(true);
  };


  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingGroup(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingGroup 
        ? `/api/courses/${courseId}/groups/${editingGroup._id}`
        : `/api/courses/${courseId}/groups`;
      
      const method = editingGroup ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          maxStudents: formData.maxStudents,
          instructor: formData.instructor || undefined,
          schedule: formData.schedules.length > 0 ? formData.schedules : undefined,
          notificationSettings: formData.notificationSettings,
        }),
      });

      if (response.ok) {
        handleCloseModal();
        fetchGroups();
      } else {
        alert('Failed to save group');
      }
    } catch (error) {
      console.error('Error saving group:', error);
      alert('Error saving group');
    }
  };


  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm(t('deleteConfirm'))) return;

    try {
      const response = await fetch(`/api/courses/${courseId}/groups/${groupId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchGroups();
      } else {
        alert('Failed to delete group');
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      alert('Error deleting group');
    }
  };

  const handleOpenAssignModal = (group: Group) => {
    setSelectedGroupForAssign(group);
    setSelectedStudents(group.students.map(s => s._id));
    setIsAssignModalOpen(true);
  };

  const handleAssignStudents = async () => {
    if (!selectedGroupForAssign) return;

    try {
      const response = await fetch(`/api/courses/${courseId}/groups/${selectedGroupForAssign._id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentIds: selectedStudents,
        }),
      });

      if (response.ok) {
        setIsAssignModalOpen(false);
        setSelectedGroupForAssign(null);
        fetchGroups();
      } else {
        alert('Failed to assign students');
      }
    } catch (error) {
      console.error('Error assigning students:', error);
      alert('Error assigning students');
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link
            href="/dashboard/admin/courses"
            className="mr-4 p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {course?.title?.en || 'Course Groups'}
            </p>
          </div>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('createGroup')}
        </button>
      </div>

      {/* Student Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Enrolled</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{enrollments.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Assigned to Groups</p>
          <p className="text-2xl font-bold text-blue-600">
            {groups.reduce((acc, group) => acc + group.students.length, 0)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Unassigned</p>
          <p className="text-2xl font-bold text-orange-600">
            {enrollments.length - groups.reduce((acc, group) => acc + group.students.length, 0)}
          </p>
        </div>
      </div>


      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-white dark:bg-slate-800 rounded-lg shadow">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">{t('noGroups')}</p>
          </div>
        ) : (
          groups.map((group) => (
            <div 
              key={group._id}
              className="bg-white dark:bg-slate-800 rounded-lg shadow p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {group.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {group.students.length} / {group.maxStudents} {t('students')}
                  </p>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleOpenModal(group)}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition"
                    title={t('edit')}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteGroup(group._id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                    title={t('delete')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${(group.students.length / group.maxStudents) * 100}%` }}
                />
              </div>

              {/* Schedule */}
              {group.schedule && group.schedule.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('schedule')}:
                  </p>
                  {group.schedule.map((sched, idx) => (
                    <p key={idx} className="text-sm text-gray-600 dark:text-gray-400">
                      {sched.dayOfWeek} {t('at')} {sched.time} ({sched.lessonType})
                    </p>
                  ))}
                </div>
              )}


              {/* Instructor */}
              {group.instructor && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {t('instructor')}: {group.instructor.name}
                </p>
              )}

              {/* Students */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('enrolledStudents')}
                  </span>
                  <button
                    onClick={() => handleOpenAssignModal(group)}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                  >
                    <UserPlus className="w-4 h-4 mr-1" />
                    {t('manage')}
                  </button>
                </div>
                {group.students.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    {t('noStudents')}
                  </p>
                ) : (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {group.students.map((student) => (
                      <div 
                        key={student._id}
                        className="text-sm text-gray-600 dark:text-gray-400 flex items-center"
                      >
                        <Users className="w-3 h-3 mr-2 text-gray-400" />
                        {student.name || student.email}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">

            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingGroup ? t('editGroup') : t('createGroup')}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Info Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('groupName')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                    placeholder="e.g., Group A - Morning Session"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('maxStudents')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.maxStudents}
                    onChange={(e) => setFormData({ ...formData, maxStudents: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  />
                </div>
              </div>


              {/* Two Column Layout for Schedules and Notifications */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Schedules Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('schedules')}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          schedules: [
                            ...formData.schedules,
                            { dayOfWeek: 'monday', time: '09:00', lessonType: 'live', isActive: true }
                          ]
                        });
                      }}
                      className="inline-flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      {t('addSchedule')}
                    </button>
                  </div>
                  
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {formData.schedules.map((sched, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-gray-600 rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('schedule')} #{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const newSchedules = formData.schedules.filter((_, i) => i !== idx);
                              setFormData({ ...formData, schedules: newSchedules });
                            }}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Day</label>
                            <select
                              value={sched.dayOfWeek}
                              onChange={(e) => {
                                const newSchedules = [...formData.schedules];
                                newSchedules[idx].dayOfWeek = e.target.value;
                                setFormData({ ...formData, schedules: newSchedules });
                              }}
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                            >
                              <option value="monday">{t('monday')}</option>
                              <option value="tuesday">{t('tuesday')}</option>
                              <option value="wednesday">{t('wednesday')}</option>
                              <option value="thursday">{t('thursday')}</option>
                              <option value="friday">{t('friday')}</option>
                              <option value="saturday">{t('saturday')}</option>
                              <option value="sunday">{t('sunday')}</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Time</label>
                            <input
                              type="time"
                              value={sched.time}
                              onChange={(e) => {
                                const newSchedules = [...formData.schedules];
                                newSchedules[idx].time = e.target.value;
                                setFormData({ ...formData, schedules: newSchedules });
                              }}
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Type</label>
                          <select
                            value={sched.lessonType}
                            onChange={(e) => {
                              const newSchedules = [...formData.schedules];
                              newSchedules[idx].lessonType = e.target.value as 'live' | 'recorded';
                              setFormData({ ...formData, schedules: newSchedules });
                            }}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                          >
                            <option value="live">{t('liveLesson')}</option>
                            <option value="recorded">{t('recordedLesson')}</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {formData.schedules.length === 0 && (
                    <div className="p-8 text-center bg-gray-50 dark:bg-slate-700/30 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t('noSchedules')}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Click "Add Schedule" to create one
                      </p>
                    </div>
                  )}
                </div>


                {/* Notification Settings */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('notificationSettings')}
                    </h4>
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.notificationSettings.enabled}
                        onChange={(e) => setFormData({
                          ...formData,
                          notificationSettings: {
                            ...formData.notificationSettings,
                            enabled: e.target.checked
                          }
                        })}
                        className="sr-only peer"
                      />
                      <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      <span className="ms-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('enableNotifications')}
                      </span>
                    </label>
                  </div>

                  {formData.notificationSettings.enabled && (
                    <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.notificationSettings.earlyMorningEnabled}
                              onChange={(e) => setFormData({
                                ...formData,
                                notificationSettings: {
                                  ...formData.notificationSettings,
                                  earlyMorningEnabled: e.target.checked
                                }
                              })}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{t('earlyMorningReminder')}</span>
                          </label>
                          {formData.notificationSettings.earlyMorningEnabled && (
                            <input
                              type="time"
                              value={formData.notificationSettings.earlyMorningTime}
                              onChange={(e) => setFormData({
                                ...formData,
                                notificationSettings: {
                                  ...formData.notificationSettings,
                                  earlyMorningTime: e.target.value
                                }
                              })}
                              className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                            />
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.notificationSettings.oneHourEnabled}
                            onChange={(e) => setFormData({
                              ...formData,
                              notificationSettings: {
                                ...formData.notificationSettings,
                                oneHourEnabled: e.target.checked
                              }
                            })}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{t('oneHourReminder')}</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-blue-200 dark:border-blue-800">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('notificationTypes')}
                        </label>
                        <div className="flex space-x-6">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.notificationSettings.notificationTypes.includes('email')}
                              onChange={(e) => {
                                const types = (e.target.checked
                                  ? [...formData.notificationSettings.notificationTypes, 'email']
                                  : formData.notificationSettings.notificationTypes.filter(t => t !== 'email')) as ('email' | 'in_app')[];
                                setFormData({
                                  ...formData,
                                  notificationSettings: {
                                    ...formData.notificationSettings,
                                    notificationTypes: types
                                  }
                                });
                              }}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{t('email')}</span>
                          </label>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.notificationSettings.notificationTypes.includes('in_app')}
                              onChange={(e) => {
                                const types = (e.target.checked
                                  ? [...formData.notificationSettings.notificationTypes, 'in_app']
                                  : formData.notificationSettings.notificationTypes.filter(t => t !== 'in_app')) as ('email' | 'in_app')[];
                                setFormData({
                                  ...formData,
                                  notificationSettings: {
                                    ...formData.notificationSettings,
                                    notificationTypes: types
                                  }
                                });
                              }}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{t('inApp')}</span>
                          </label>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-blue-200 dark:border-blue-800">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('alertType')}
                        </label>
                        <select
                          value={formData.notificationSettings.alertType}
                          onChange={(e) => setFormData({
                            ...formData,
                            notificationSettings: {
                              ...formData.notificationSettings,
                              alertType: e.target.value as 'live_lesson' | 'recorded_lesson'
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                        >
                          <option value="live_lesson">{t('liveLesson')}</option>
                          <option value="recorded_lesson">{t('recordedLesson')}</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {!formData.notificationSettings.enabled && (
                    <div className="p-6 text-center bg-gray-50 dark:bg-slate-700/30 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Notifications are disabled for this group
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Enable notifications to configure reminder settings
                      </p>
                    </div>
                  )}
                </div>
              </div>



              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition font-medium"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center font-medium shadow-sm"
                >
                  <Check className="w-5 h-5 mr-2" />
                  {editingGroup ? t('saveChanges') : t('create')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Assign Students Modal */}
      {isAssignModalOpen && selectedGroupForAssign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('assignStudents')}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedGroupForAssign.name} ({selectedStudents.length} / {selectedGroupForAssign.maxStudents} {t('students')})
                </p>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {/* Filter Tabs */}
              <div className="flex space-x-2 mb-4">
                <button
                  onClick={() => setStudentFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    studentFilter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                  }`}
                >
                  All Students
                </button>
                <button
                  onClick={() => setStudentFilter('assigned')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    studentFilter === 'assigned'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                  }`}
                >
                  In This Group
                </button>
                <button
                  onClick={() => setStudentFilter('unassigned')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    studentFilter === 'unassigned'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                  }`}
                >
                  No Group
                </button>
              </div>

              <div className="space-y-2">
                {(enrolledStudents || []).filter((user) => {

                  if (studentFilter === 'all') return true;
                  if (studentFilter === 'assigned') return selectedStudents.includes(user._id);
                  if (studentFilter === 'unassigned') {
                    // Check if user is in any group
                    const isInAnyGroup = groups.some(g => g.students.some(s => s._id === user._id));
                    return !isInAnyGroup;
                  }
                  return true;
                }).map((user) => {

                  const isSelected = selectedStudents.includes(user._id);
                  const isFull = selectedStudents.length >= selectedGroupForAssign.maxStudents && !isSelected;
                  
                  return (
                    <label 
                      key={user._id}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                          : isFull
                            ? 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={isFull}
                        onChange={() => toggleStudentSelection(user._id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.name || user.email}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {user.email}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleAssignStudents}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center"
              >
                <Check className="w-4 h-4 mr-2" />
                {t('saveAssignments')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
