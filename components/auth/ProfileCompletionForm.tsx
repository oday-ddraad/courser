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
  CheckCircle, 
  ChevronRight, 
  ChevronLeft,
  Loader2,
  Upload,
  X,
  Check
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ProfileData {
  firstName: string;
  lastName: string;
  country: string;
  phoneNumber: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  whatsappConsent: boolean;
}

// Country code mapping
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


interface Document {
  name: string;
  file: File | null;
}

type DocumentType = 'nationalId' | 'passport' | 'certificate' | 'other';


export default function ProfileCompletionForm({ locale }: { locale: string }) {
  const t = useTranslations('Auth');
  const router = useRouter();
  const { data: session, update } = useSession();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: '',
    lastName: '',
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
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType | ''>('');
  const [customDocumentName, setCustomDocumentName] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);


  // Fetch user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/profile/complete');
        const data = await response.json();
        
        if (data.success) {
          setUserData(data.user);
          
          // Pre-fill data if available
          if (data.user.firstName) {
            setProfileData(prev => ({
              ...prev,
              firstName: data.user.firstName || '',
              lastName: data.user.lastName || '',
              country: data.user.country || '',
              phoneNumber: data.user.phoneNumber || '',
              address: data.user.address || {
                street: '',
                city: '',
                state: '',
                zipCode: '',
              },
              whatsappConsent: data.user.whatsappConsent || false,
            }));
          }
          
          // If profile already completed, redirect to dashboard
          if (data.user.profileCompleted) {
            router.push('/dashboard');
          }
        }
      } catch (error) {
        toast.error(t('completeProfile.failedToLoad'));
      } finally {

        setInitialLoading(false);
      }
    };
    
    fetchUserData();
  }, [router]);

  const handleInputChange = (field: keyof ProfileData, value: any) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleCountryChange = (country: string) => {
    const countryCode = countryCodes[country] || '';
    setProfileData(prev => ({
      ...prev,
      country,
      phoneNumber: countryCode,
    }));
  };


  const handleAddressChange = (field: keyof ProfileData['address'], value: string) => {
    setProfileData(prev => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));
  };

  const getDocumentDisplayName = (type: DocumentType | ''): string => {
    if (!type) return '';
    if (type === 'other') return customDocumentName.trim();
    return t(`completeProfile.documentTypes.${type}`);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setUploadingFile(true);
    
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
        setDocuments(prev => [...prev, { name: documentName, file: null }]);
        setSelectedDocumentType('');
        setCustomDocumentName('');
        toast.success(t('completeProfile.documentUploaded'));
      } else {
        toast.error(data.error || t('completeProfile.failedToUpload'));
      }
    } catch (error) {
      toast.error(t('completeProfile.failedToUpload'));
    } finally {
      setUploadingFile(false);
    }
  };


  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const validateStep = () => {
    switch (step) {
      case 1:
        return profileData.firstName && profileData.lastName && profileData.country;
      case 2:
        // Phone is required
        if (!profileData.phoneNumber) {
          toast.error(t('completeProfile.phoneNumberRequired') || 'Phone number is required');
          return false;
        }
        if (!/^\+[1-9]\d{1,14}$/.test(profileData.phoneNumber)) {
          toast.error(t('completeProfile.phoneHint'));
          return false;
        }

        return true;
      case 3:
        // Address is optional
        return true;
      case 4:
        // Documents are optional
        return true;
      case 5:
        return true; // Consent step
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep()) {
      if (step === 1) {
        toast.error(t('completeProfile.failedToComplete'));
      }
      return;
    }

    setStep(prev => Math.min(prev + 1, 5));
  };

  const handleBack = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/profile/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(t('completeProfile.profileCompleted'));
        
        // Update session

        await update({
          ...session,
          user: {
            ...session?.user,
            profileCompleted: true,
          },
        });
        
        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        toast.error(data.error || t('completeProfile.failedToComplete'));
      }
    } catch (error) {
      toast.error(t('completeProfile.failedToComplete'));
    } finally {

      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const steps = [
    { number: 1, title: t('completeProfile.step1'), icon: User },
    { number: 2, title: t('completeProfile.step2'), icon: Phone },
    { number: 3, title: t('completeProfile.step3'), icon: MapPin },
    { number: 4, title: t('completeProfile.step4'), icon: FileText },
    { number: 5, title: t('completeProfile.step5'), icon: CheckCircle },
  ];


  const isGoogleUser = userData?.provider === 'google';
  const isDevelopment = process.env.NODE_ENV === 'development';
  const emailVerified = !!userData?.emailVerified || isDevelopment;


  return (
    <div className="w-full max-w-2xl p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800">
      {/* Progress Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-center mb-2">{t('completeProfile.title')}</h1>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
          {t('completeProfile.subtitle')}
        </p>

        
        {/* Step indicators - Clickable */}
        <div className="flex justify-between items-center">
          {steps.map((s, index) => (
            <div key={s.number} className="flex items-center">
              <button
                onClick={() => setStep(s.number)}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 ${
                  step >= s.number
                    ? 'bg-blue-600 text-white cursor-pointer'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {step > s.number ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <s.icon className="w-5 h-5" />
                )}
              </button>
              {index < steps.length - 1 && (
                <div
                  className={`w-12 h-1 mx-2 ${
                    step > s.number ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

      </div>

      {/* Step 1: Personal Info */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">{t('completeProfile.step1')}</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('completeProfile.firstName')} *</label>

              <input
                type="text"
                value={profileData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700"
                placeholder="John"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('completeProfile.lastName')} *</label>

              <input
                type="text"
                value={profileData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700"
                placeholder="Doe"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('completeProfile.country')} *</label>
            <select
              value={profileData.country}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700"
              required
            >

              <option value="">{t('completeProfile.selectCountry')}</option>

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
        </div>
      )}

      {/* Step 2: Contact */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">{t('completeProfile.step2')}</h2>
          
          {/* Email Display */}
          <div>
            <label className="block text-sm font-medium mb-1">{t('emailLabel')}</label>

            <div className="flex items-center gap-2">
              <input
                type="email"
                value={userData?.email || ''}
                disabled
                className="flex-1 p-3 rounded-lg border bg-gray-100 dark:bg-slate-800 dark:border-slate-700"
              />
              {isGoogleUser ? (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                  {t('completeProfile.emailVerifiedByGoogle')}
                </span>
              ) : emailVerified ? (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                  {t('completeProfile.emailVerified')}
                </span>
              ) : (
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/auth/verify-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: userData?.email, locale }),
                      });
                      const data = await response.json();
                      if (data.success) {
                        toast.success(t('completeProfile.emailVerificationSent'));
                      } else {
                        toast.error(data.error || t('completeProfile.failedToUpload'));
                      }
                    } catch (error) {
                      toast.error(t('completeProfile.failedToUpload'));
                    }
                  }}
                  className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm hover:bg-yellow-200"
                >
                  {t('completeProfile.verifyEmail')}
                </button>
              )}
            </div>
            {!isGoogleUser && !emailVerified && !isDevelopment && (
              <p className="text-sm text-yellow-600 mt-1">
                {t('completeProfile.emailVerificationRequired')}
              </p>
            )}
            {isDevelopment && !isGoogleUser && (
              <p className="text-sm text-green-600 mt-1">
                Auto-verified in development mode
              </p>
            )}

          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t('completeProfile.phoneNumber')} *
            </label>

            <div className="flex gap-2">
              <input
                type="tel"
                value={profileData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                className="flex-1 p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700"
                placeholder="+1234567890"
                required
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {t('completeProfile.phoneHint')}
            </p>

          </div>

        </div>
      )}

      {/* Step 3: Address */}
      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">{t('completeProfile.addressOptional')}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {t('completeProfile.addressHint')}
          </p>
          
          <div>
            <label className="block text-sm font-medium mb-1">{t('completeProfile.streetAddress')} <span className="text-gray-400 font-normal">({t('completeProfile.optional')})</span></label>


            <input
              type="text"
              value={profileData.address.street}
              onChange={(e) => handleAddressChange('street', e.target.value)}
              className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700"
              placeholder="123 Main St"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('completeProfile.city')} <span className="text-gray-400 font-normal">({t('completeProfile.optional')})</span></label>

              <input
                type="text"
                value={profileData.address.city}
                onChange={(e) => handleAddressChange('city', e.target.value)}
                className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700"
                placeholder="New York"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('completeProfile.state')} <span className="text-gray-400 font-normal">({t('completeProfile.optional')})</span></label>

              <input
                type="text"
                value={profileData.address.state}
                onChange={(e) => handleAddressChange('state', e.target.value)}
                className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700"
                placeholder="NY"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('completeProfile.zipCode')} <span className="text-gray-400 font-normal">({t('completeProfile.optional')})</span></label>

            <input
              type="text"
              value={profileData.address.zipCode}
              onChange={(e) => handleAddressChange('zipCode', e.target.value)}
              className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700"
              placeholder="10001"
            />
          </div>
          
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg mt-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 {t('completeProfile.skipTip')}
            </p>
          </div>
        </div>
      )}



      {/* Step 4: Documents */}
      {step === 4 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">{t('completeProfile.documents')}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {t('completeProfile.documentsHint')}
          </p>


          {/* Document List */}
          {documents.length > 0 && (
            <div className="space-y-2 mb-4">
              {documents.map((doc, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span>{doc.name}</span>
                  </div>
                  <button
                    onClick={() => removeDocument(index)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add New Document */}
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('completeProfile.documentType')} *
                </label>
                <select
                  value={selectedDocumentType}
                  onChange={(e) => setSelectedDocumentType(e.target.value as DocumentType | '')}
                  className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700"
                  required
                >
                  <option value="">{t('completeProfile.selectDocumentType')}</option>
                  <option value="nationalId">{t('completeProfile.documentTypes.nationalId')}</option>
                  <option value="passport">{t('completeProfile.documentTypes.passport')}</option>
                  <option value="certificate">{t('completeProfile.documentTypes.certificate')}</option>
                  <option value="other">{t('completeProfile.documentTypes.other')}</option>
                </select>
              </div>

              {/* Custom name input for "Other" option */}
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
                    required
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium mb-1">{t('completeProfile.uploadFile')}</label>

                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={handleFileSelect}
                    disabled={uploadingFile || !selectedDocumentType || (selectedDocumentType === 'other' && !customDocumentName.trim())}
                    className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {uploadingFile && (
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
      )}


      {/* Step 5: Consent */}
      {step === 5 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">{t('completeProfile.step5')}</h2>
          
          <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={profileData.whatsappConsent}
                onChange={(e) => handleInputChange('whatsappConsent', e.target.checked)}
                className="mt-1 w-5 h-5 text-blue-600 rounded"
              />
              <div>
                <span className="font-medium">{t('completeProfile.whatsappConsent')}</span>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {t('completeProfile.whatsappConsentText')}
                </p>
              </div>
            </label>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              {t('completeProfile.termsAgreement')}
            </p>
          </div>
        </div>
      )}


      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <button
          onClick={handleBack}
          disabled={step === 1 || loading}
          className="flex items-center gap-2 px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
          {t('completeProfile.back')}
        </button>

        {step < 5 ? (
          <button
            onClick={handleNext}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {t('completeProfile.next')}
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading || (!isGoogleUser && !emailVerified)}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('completeProfile.completing')}
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                {t('completeProfile.completeProfile')}
              </>
            )}
          </button>
        )}
      </div>

      {/* Email verification warning for final step */}
      {step === 5 && !isGoogleUser && !emailVerified && !isDevelopment && (
        <p className="text-center text-yellow-600 mt-4 text-sm">
          {t('completeProfile.emailVerificationPending')}
        </p>
      )}
      {step === 5 && isDevelopment && !isGoogleUser && (
        <p className="text-center text-green-600 mt-4 text-sm">
          ✓ Development mode: Email auto-verified
        </p>
      )}


    </div>
  );
}
