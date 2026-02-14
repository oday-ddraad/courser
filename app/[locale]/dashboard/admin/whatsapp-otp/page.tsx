'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function WhatsAppOTPPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [serviceStatus, setServiceStatus] = useState<{ configured: boolean; message: string } | null>(null);

  // Check if user is admin
  if (status === 'loading') {
    return <div className="p-8">Loading...</div>;
  }

  if (!session || session.user.role !== 'admin') {
    router.push('/login');
    return null;
  }

  const checkServiceStatus = async () => {
    try {
      const response = await fetch('/api/notifications/whatsapp');
      const data = await response.json();
      setServiceStatus(data);
    } catch (error) {
      setServiceStatus({
        configured: false,
        message: 'Failed to check service status',
      });
    }
  };

  const sendOTP = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/whatsapp/otp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          purpose: 'verification',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          type: 'success',
          message: `OTP sent successfully! Expires at: ${new Date(data.expiresAt).toLocaleTimeString()}`,
        });
      } else {
        setResult({
          type: 'error',
          message: data.error || 'Failed to send OTP',
        });
      }
    } catch (error) {
      setResult({
        type: 'error',
        message: 'Network error. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/whatsapp/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: otpCode,
          purpose: 'verification',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          type: 'success',
          message: 'OTP verified successfully! Your phone number is now verified.',
        });
      } else {
        setResult({
          type: 'error',
          message: data.error || 'Failed to verify OTP',
        });
      }
    } catch (error) {
      setResult({
        type: 'error',
        message: 'Network error. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">WhatsApp OTP Testing</h1>
      
      {/* Service Status */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Service Status</h2>
        <button
          onClick={checkServiceStatus}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-4"
        >
          Check Status
        </button>
        {serviceStatus && (
          <div className={`p-4 rounded ${serviceStatus.configured ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
            <p className="font-medium">{serviceStatus.configured ? '✅ Configured' : '⚠️ Not Configured'}</p>
            <p>{serviceStatus.message}</p>
          </div>
        )}
      </div>

      {/* Send OTP Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">1. Send OTP</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Phone Number (E.164 format)</label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1234567890"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-sm text-gray-500 mt-1">Format: +[country code][number] (e.g., +1234567890)</p>
          </div>
          <button
            onClick={sendOTP}
            disabled={loading || !phoneNumber}
            className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </div>
      </div>

      {/* Verify OTP Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">2. Verify OTP</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">OTP Code</label>
            <input
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="123456"
              maxLength={6}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={verifyOTP}
            disabled={loading || !otpCode}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </div>
      </div>

      {/* Result Display */}
      {result && (
        <div className={`p-4 rounded-lg ${result.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          <p className="font-medium">{result.type === 'success' ? '✅ Success' : '❌ Error'}</p>
          <p>{result.message}</p>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gray-50 rounded-lg p-6 mt-8">
        <h2 className="text-xl font-semibold mb-4">Setup Instructions</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Set up WhatsApp Business API account at <a href="https://business.facebook.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Meta Business</a></li>
          <li>Create message templates in Meta Business Manager (otp_verification, welcome_message, course_enrollment, live_stream_starting, payment_approved)</li>
          <li>Add environment variables to your .env file:
            <ul className="list-disc list-inside ml-6 mt-1 text-xs font-mono bg-gray-100 p-2 rounded">
              <li>WHATSAPP_API_VERSION=v18.0</li>
              <li>WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id</li>
              <li>WHATSAPP_ACCESS_TOKEN=your_access_token</li>
              <li>WHATSAPP_WEBHOOK_SECRET=your_webhook_secret</li>
              <li>WHATSAPP_VERIFY_TOKEN=your_verify_token</li>
            </ul>
          </li>
          <li>Configure webhook URL in Meta Developer Dashboard: <code className="bg-gray-100 px-1 rounded">https://your-domain.com/api/whatsapp/webhook</code></li>
          <li>Verify webhook and subscribe to messages and message_status events</li>
        </ol>
      </div>
    </div>
  );
}
