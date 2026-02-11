'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/auth/permissions';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Star, 
  Users, 
  BookOpen, 
  Edit, 
  Trash2, 
  X,
  Check,
  Mail,
  Loader2,
  GraduationCap
} from 'lucide-react';
import Link from 'next/link';

interface Instructor {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  instructorProfile?: {
    bio: {
      en: string;
      de: string;
      ar: string;
    };
    specialization: string[];
    rating: number;
    totalStudents: number;
    totalCourses: number;
  };
  isActive: boolean;
  createdAt: string;
}

export default function InstructorsManagementPage() {
  const { data: session, status } = useSession();
  const t = useTranslations('Dashboard.admin.instructors');
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bioEn: '',
    bioDe: '',
    bioAr: '',
    specialization: '',
    isActive: true,
  });

  useEffect(() => {
    if (status !== 'loading' && session && hasPermission(session.user.role, 'user.manage')) {
      fetchInstructors();
    }
  }, [status, session]);

  if (status === 'loading') {
    return <div className="p-6">Loading...</div>;
  }

  if (!session || !hasPermission(session.user.role, 'user.manage')) {
    redirect('/forbidden');
  }


  const fetchInstructors = async () => {
    try {
      const response = await fetch('/api/users?role=instructor&limit=1000');
      const data = await response.json();
      if (data.success) {
        setInstructors(data.data.users);
      }
    } catch (error) {
      console.error('Error fetching instructors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInstructors = instructors.filter(instructor => 
    instructor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    instructor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    instructor.instructorProfile?.specialization.some(s => 
      s.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleOpenModal = (instructor?: Instructor) => {
    if (instructor) {
      setEditingInstructor(instructor);
      setFormData({
        name: instructor.name,
        email: instructor.email,
        bioEn: instructor.instructorProfile?.bio?.en || '',
        bioDe: instructor.instructorProfile?.bio?.de || '',
        bioAr: instructor.instructorProfile?.bio?.ar || '',
        specialization: instructor.instructorProfile?.specialization?.join(', ') || '',
        isActive: instructor.isActive,
      });
    } else {
      setEditingInstructor(null);
      setFormData({
        name: '',
        email: '',
        bioEn: '',
        bioDe: '',
        bioAr: '',
        specialization: '',
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingInstructor(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingInstructor 
        ? `/api/users/${editingInstructor._id}`
        : '/api/register';
      
      const method = editingInstructor ? 'PUT' : 'POST';
      
      const body = editingInstructor ? {
        name: formData.name,
        instructorProfile: {
          bio: {
            en: formData.bioEn,
            de: formData.bioDe,
            ar: formData.bioAr,
          },
          specialization: formData.specialization.split(',').map(s => s.trim()).filter(Boolean),
        },
        isActive: formData.isActive,
      } : {
        name: formData.name,
        email: formData.email,
        password: 'tempPassword123', // Temporary password
        role: 'instructor',
        instructorProfile: {
          bio: {
            en: formData.bioEn,
            de: formData.bioDe,
            ar: formData.bioAr,
          },
          specialization: formData.specialization.split(',').map(s => s.trim()).filter(Boolean),
        },
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        handleCloseModal();
        fetchInstructors();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to save instructor');
      }
    } catch (error) {
      console.error('Error saving instructor:', error);
      alert('Error saving instructor');
    }
  };

  const handleDeleteInstructor = async (instructorId: string) => {
    if (!confirm(t('deleteConfirm'))) return;

    try {
      const response = await fetch(`/api/users/${instructorId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchInstructors();
      } else {
        alert('Failed to delete instructor');
      }
    } catch (error) {
      console.error('Error deleting instructor:', error);
      alert('Error deleting instructor');
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('subtitle')}
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('addInstructor')}
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('totalInstructors')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{instructors.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('totalCourses')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {instructors.reduce((sum, i) => sum + (i.instructorProfile?.totalCourses || 0), 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600">
              <Users className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('totalStudents')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {instructors.reduce((sum, i) => sum + (i.instructorProfile?.totalStudents || 0), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Instructors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInstructors.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-white dark:bg-slate-800 rounded-lg shadow">
            <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery ? t('noSearchResults') : t('noInstructors')}
            </p>
          </div>
        ) : (
          filteredInstructors.map((instructor) => (
            <div 
              key={instructor._id}
              className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 text-lg font-semibold">
                      {instructor.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {instructor.name}
                      </h3>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Mail className="w-3 h-3 mr-1" />
                        {instructor.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleOpenModal(instructor)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition"
                      title={t('edit')}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteInstructor(instructor._id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                      title={t('delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Rating */}
                {instructor.instructorProfile && instructor.instructorProfile.rating > 0 && (
                  <div className="mt-4 flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="ml-1 text-sm text-gray-700 dark:text-gray-300">
                      {instructor.instructorProfile.rating.toFixed(1)}
                    </span>
                  </div>
                )}


                {/* Stats */}
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="text-center p-2 bg-gray-50 dark:bg-slate-700 rounded">
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {instructor.instructorProfile?.totalCourses || 0}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('courses')}</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 dark:bg-slate-700 rounded">
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {instructor.instructorProfile?.totalStudents || 0}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('students')}</p>
                  </div>
                </div>

                {/* Specializations */}
                {instructor.instructorProfile?.specialization && instructor.instructorProfile?.specialization.length > 0 && (

                  <div className="mt-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t('specializations')}</p>
                    <div className="flex flex-wrap gap-2">
                      {instructor.instructorProfile.specialization.map((spec, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status */}
                <div className="mt-4">
                  <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                    instructor.isActive 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                  }`}>
                    {instructor.isActive ? t('active') : t('inactive')}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingInstructor ? t('editInstructor') : t('addInstructor')}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('name')} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('email')} {!editingInstructor && '*'}
                </label>
                <input
                  type="email"
                  required={!editingInstructor}
                  disabled={!!editingInstructor}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-slate-800"
                />
                {editingInstructor && (
                  <p className="text-xs text-gray-500 mt-1">{t('emailCannotChange')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('bioEn')}
                </label>
                <textarea
                  rows={3}
                  value={formData.bioEn}
                  onChange={(e) => setFormData({ ...formData, bioEn: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('bioDe')}
                </label>
                <textarea
                  rows={3}
                  value={formData.bioDe}
                  onChange={(e) => setFormData({ ...formData, bioDe: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('bioAr')}
                </label>
                <textarea
                  rows={3}
                  dir="rtl"
                  value={formData.bioAr}
                  onChange={(e) => setFormData({ ...formData, bioAr: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('specialization')}
                </label>
                <input
                  type="text"
                  placeholder={t('specializationPlaceholder')}
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                />
                <p className="text-xs text-gray-500 mt-1">{t('specializationHelp')}</p>
              </div>

              {editingInstructor && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isActive" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    {t('isActive')}
                  </label>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center"
                >
                  <Check className="w-4 h-4 mr-2" />
                  {editingInstructor ? t('saveChanges') : t('create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
