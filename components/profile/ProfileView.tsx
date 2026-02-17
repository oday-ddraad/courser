'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import {
  User,
  MapPin,
  Phone,
  FileText,
  Mail,
  Upload,
  X,
  Loader2,
  CheckCircle,
  Trash2,
  Download,
  Edit2,
  Save,
  Camera,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';

import toast from 'react-hot-toast';

interface UserData {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  role: string;
  locale: string;
  country: string;
  phoneNumber: string;
  phoneVerified: Date | null;
  whatsappConsent: boolean;
  avatar: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  documents: Array<{
    _id: string;
    name: string;
    fileUrl: string;
    fileType: string;
    uploadedAt: string;
  }>;
  provider: string;
  emailVerified: boolean;
  profileCompleted: boolean;
}

type DocumentType = 'nationalId' | 'passport' | 'certificate' | 'other';

const countryCodes: Record<string, string> = {
  US: '+1',
  DE: '+49',
  GB: '+44',
  FR: '+33',
  CA: '+1',
  AU: '+61',
  SY: '+963',
  SA: '+966',
  AE: '+971',
  EG: '+20',
  TR: '+90',
  OTHER: '',
};

export default function ProfileView({ locale }: { locale: string }) {
  const t = useTranslations('Auth');
  const router = useRouter();
  const { data: session, update } = useSession();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType | ''>('');
  const [customDocumentName, setCustomDocumentName] = useState('');
  const [uploadingDocument, setUploadingDocument] = useState(false);
  
  // Password change state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);


  const [formData, setFormData] = useState({
    country: '',
    phoneNumber: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
    },
    whatsappConsent: false,
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile');
      const data = await response.json();

      if (data.success) {
        setUserData(data.user);
        setFormData({
          country: data.user.country || '',
          phoneNumber: data.user.phoneNumber || '',
          address: data.user.address || {
            street: '',
            city: '',
            state: '',
            zipCode: '',
          },
          whatsappConsent: data.user.whatsappConsent || false,
        });
      } else {
        toast.error(t('completeProfile.failedToLoad'));
      }
    } catch (error) {
      toast.error(t('completeProfile.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setUserData((prev) => (prev ? { ...prev, avatar: data.avatar } : null));
        await update({ ...session, user: { ...session?.user, avatar: data.avatar } });
        toast.success('Avatar updated successfully');
      } else {
        toast.error(data.error || 'Failed to upload avatar');
      }
    } catch (error) {
      toast.error('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setUserData((prev) => (prev ? { ...prev, ...data.user } : null));
        setEditing(false);
        toast.success('Profile updated successfully');
      } else {
        toast.error(data.error || 'Failed to update profile');
      }
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const getDocumentDisplayName = (type: DocumentType | ''): string => {
    if (!type) return '';
    if (type === 'other') return customDocumentName.trim();
    return t(`completeProfile.documentTypes.${type}`);
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const documentName = getDocumentDisplayName(selectedDocumentType);

    if (!documentName) {
      toast.error(t('completeProfile.selectDocumentType'));
      return;
    }

    if (selectedDocumentType === 'other' && !customDocumentName.trim()) {
      toast.error(t('completeProfile.enterDocumentName'));
      return;
    }

    setUploadingDocument(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentName', documentName);
      formData.append('documentType', selectedDocumentType);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        await fetchProfile();
        setSelectedDocumentType('');
        setCustomDocumentName('');
        toast.success(t('completeProfile.documentUploaded'));
      } else {
        toast.error(data.error || t('completeProfile.failedToUpload'));
      }
    } catch (error) {
      toast.error(t('completeProfile.failedToUpload'));
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await fetchProfile();
        toast.success('Document deleted successfully');
      } else {
        toast.error(data.error || 'Failed to delete document');
      }
    } catch (error) {
      toast.error('Failed to delete document');
    }
  };

  const handleCountryChange = (country: string) => {
    const countryCode = countryCodes[country] || '';
    setFormData((prev) => ({
      ...prev,
      country,
      phoneNumber: countryCode,
    }));
  };

  // Password strength validation
  const validatePasswordStrength = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    return errors;
  };

  const handlePasswordChange = async () => {
    // Validate passwords
    if (!passwordData.currentPassword) {
      toast.error('Please enter your current password');
      return;
    }
    if (!passwordData.newPassword) {
      toast.error('Please enter a new password');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    const strengthErrors = validatePasswordStrength(passwordData.newPassword);
    if (strengthErrors.length > 0) {
      setPasswordErrors(strengthErrors);
      return;
    }

    setChangingPassword(true);
    setPasswordErrors([]);

    try {
      const response = await fetch('/api/users/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Password changed successfully');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowPasswordSection(false);
      } else {
        toast.error(data.error || 'Failed to change password');
      }
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Failed to load profile</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              My Profile
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              View and manage your profile information
            </p>
          </div>
          <button
            onClick={() => (editing ? handleSave() : setEditing(true))}
            disabled={saving}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 w-full sm:w-auto"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : editing ? (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            ) : (
              <>
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Avatar & Basic Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Avatar Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 sm:p-6">
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                  {userData.avatar ? (
                    <img
                      src={userData.avatar}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-16 h-16 text-gray-400" />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full cursor-pointer hover:bg-blue-700 shadow-lg">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={uploadingAvatar}
                    className="hidden"
                  />
                </label>
                {uploadingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                    <Loader2 className="w-8 h-8 animate-spin text-white" />
                  </div>
                )}
              </div>
              <h2 className="mt-4 text-xl font-semibold text-center">
                {userData.firstName} {userData.lastName}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm capitalize">
                {userData.role}
              </p>
            </div>
          </div>

          {/* Read-only Info */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 sm:p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              Contact Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Email</label>
                <p className="font-medium">{userData.email}</p>
                {userData.emailVerified && (
                  <span className="inline-flex items-center gap-1 text-xs text-green-600 mt-1">
                    <CheckCircle className="w-3 h-3" />
                    Verified
                  </span>
                )}
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Account Type</label>
                <p className="font-medium capitalize">{userData.provider}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Member Since</label>
                <p className="font-medium">
                  {new Date(userData.profileCompleted ? Date.now() : 0).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Editable Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Info */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 sm:p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">First Name</label>
                <input
                  type="text"
                  value={userData.firstName}
                  disabled
                  className="w-full p-3 rounded-lg border bg-gray-100 dark:bg-slate-800 dark:border-slate-700"
                />
                <p className="text-xs text-gray-500 mt-1">Cannot be changed</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Last Name</label>
                <input
                  type="text"
                  value={userData.lastName}
                  disabled
                  className="w-full p-3 rounded-lg border bg-gray-100 dark:bg-slate-800 dark:border-slate-700"
                />
                <p className="text-xs text-gray-500 mt-1">Cannot be changed</p>
              </div>
            </div>
          </div>

          {/* Contact & Location */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 sm:p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Contact & Location
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Country</label>
                  <select
                    value={formData.country}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    disabled={!editing}
                    className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700 disabled:bg-gray-100 disabled:text-gray-600 dark:disabled:bg-slate-700 dark:disabled:text-gray-400"
                  >

                    <option value="">Select Country</option>
                    <option value="US">United States</option>
                    <option value="DE">Germany</option>
                    <option value="GB">United Kingdom</option>
                    <option value="FR">France</option>
                    <option value="CA">Canada</option>
                    <option value="AU">Australia</option>
                    <option value="SY">Syria</option>
                    <option value="SA">Saudi Arabia</option>
                    <option value="AE">UAE</option>
                    <option value="EG">Egypt</option>
                    <option value="TR">Turkey</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, phoneNumber: e.target.value }))
                    }
                    disabled={!editing}
                    className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700 disabled:bg-gray-100 disabled:text-gray-600 dark:disabled:bg-slate-700 dark:disabled:text-gray-400"
                    placeholder="+1234567890"
                  />
                </div>

              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Street Address</label>
                  <input
                    type="text"
                    value={formData.address.street}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        address: { ...prev.address, street: e.target.value },
                      }))
                    }
                    disabled={!editing}
                    className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700 disabled:bg-gray-100 disabled:text-gray-600 dark:disabled:bg-slate-700 dark:disabled:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">City</label>
                  <input
                    type="text"
                    value={formData.address.city}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        address: { ...prev.address, city: e.target.value },
                      }))
                    }
                    disabled={!editing}
                    className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700 disabled:bg-gray-100 disabled:text-gray-600 dark:disabled:bg-slate-700 dark:disabled:text-gray-400"
                  />
                </div>

              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">State/Province</label>
                  <input
                    type="text"
                    value={formData.address.state}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        address: { ...prev.address, state: e.target.value },
                      }))
                    }
                    disabled={!editing}
                    className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700 disabled:bg-gray-100 disabled:text-gray-600 dark:disabled:bg-slate-700 dark:disabled:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ZIP Code</label>
                  <input
                    type="text"
                    value={formData.address.zipCode}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        address: { ...prev.address, zipCode: e.target.value },
                      }))
                    }
                    disabled={!editing}
                    className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700 disabled:bg-gray-100 disabled:text-gray-600 dark:disabled:bg-slate-700 dark:disabled:text-gray-400"
                  />
                </div>

              </div>
            </div>
          </div>

          {/* WhatsApp Consent */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 sm:p-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.whatsappConsent}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, whatsappConsent: e.target.checked }))
                }
                disabled={!editing}
                className="mt-1 w-5 h-5 text-blue-600 rounded disabled:opacity-50"
              />
              <div>
                <span className="font-medium">{t('completeProfile.whatsappConsent')}</span>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {t('completeProfile.whatsappConsentText')}
                </p>
              </div>
            </label>
          </div>

          {/* Password Change Section */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-600" />
                Change Password
              </h3>
              <button
                onClick={() => setShowPasswordSection(!showPasswordSection)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {showPasswordSection ? 'Cancel' : 'Change Password'}
              </button>
            </div>

            {showPasswordSection && (
              <div className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium mb-1">Current Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))
                      }
                      className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700 pr-10"
                      placeholder="Enter your current password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswords((prev) => ({ ...prev, current: !prev.current }))
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium mb-1">New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => {
                        setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }));
                        setPasswordErrors(validatePasswordStrength(e.target.value));
                      }}
                      className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700 pr-10"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswords((prev) => ({ ...prev, new: !prev.new }))
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* Password Strength Requirements */}
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-gray-500 font-medium">Password must contain:</p>
                    <ul className="text-xs space-y-1">
                      <li className={passwordData.newPassword.length >= 8 ? 'text-green-600' : 'text-gray-500'}>
                        ✓ At least 8 characters
                      </li>
                      <li className={/[A-Z]/.test(passwordData.newPassword) ? 'text-green-600' : 'text-gray-500'}>
                        ✓ One uppercase letter
                      </li>
                      <li className={/[a-z]/.test(passwordData.newPassword) ? 'text-green-600' : 'text-gray-500'}>
                        ✓ One lowercase letter
                      </li>
                      <li className={/\d/.test(passwordData.newPassword) ? 'text-green-600' : 'text-gray-500'}>
                        ✓ One number
                      </li>
                      <li className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordData.newPassword) ? 'text-green-600' : 'text-gray-500'}>
                        ✓ One special character
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                      }
                      className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700 pr-10"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswords((prev) => ({ ...prev, confirm: !prev.confirm }))
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                    <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
                  )}
                </div>

                {/* Error Messages */}
                {passwordErrors.length > 0 && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 font-medium mb-1">Please fix the following:</p>
                    <ul className="text-sm text-red-600 list-disc list-inside">
                      {passwordErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  onClick={handlePasswordChange}
                  disabled={
                    changingPassword ||
                    !passwordData.currentPassword ||
                    !passwordData.newPassword ||
                    !passwordData.confirmPassword ||
                    passwordData.newPassword !== passwordData.confirmPassword ||
                    passwordErrors.length > 0
                  }
                  className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {changingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Changing Password...
                    </>
                  ) : (
                    'Change Password'
                  )}
                </button>
              </div>
            )}
          </div>


          {/* Documents Section */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 sm:p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Documents
            </h3>

            {/* Existing Documents */}
            {userData.documents?.length > 0 && (
              <div className="space-y-2 mb-6">
                {userData.documents.map((doc) => (
                  <div
                    key={doc._id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{doc.name}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => handleDeleteDocument(doc._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload New Document */}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('completeProfile.documentType')} *
                  </label>
                  <select
                    value={selectedDocumentType}
                    onChange={(e) => setSelectedDocumentType(e.target.value as DocumentType | '')}
                    className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700"
                  >
                    <option value="">{t('completeProfile.selectDocumentType')}</option>
                    <option value="nationalId">
                      {t('completeProfile.documentTypes.nationalId')}
                    </option>
                    <option value="passport">{t('completeProfile.documentTypes.passport')}</option>
                    <option value="certificate">
                      {t('completeProfile.documentTypes.certificate')}
                    </option>
                    <option value="other">{t('completeProfile.documentTypes.other')}</option>
                  </select>
                </div>

                {selectedDocumentType === 'other' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t('completeProfile.customDocumentName')} *
                    </label>
                    <input
                      type="text"
                      value={customDocumentName}
                      onChange={(e) => setCustomDocumentName(e.target.value)}
                      className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700"
                      placeholder={t('completeProfile.documentNamePlaceholder')}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('completeProfile.uploadFile')}
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      onChange={handleDocumentUpload}
                      disabled={
                        uploadingDocument ||
                        !selectedDocumentType ||
                        (selectedDocumentType === 'other' && !customDocumentName.trim())
                      }
                      className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    {uploadingDocument && (
                      <Loader2 className="absolute right-3 top-3 w-5 h-5 animate-spin text-blue-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {t('completeProfile.maxFileSize')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
