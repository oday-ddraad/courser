import crypto from 'crypto';
import dbConnect from '@/lib/mongodb/connection';
import OTP from '@/lib/mongodb/models/OTP';
import User from '@/lib/mongodb/models/User';

// WhatsApp API configuration
const WHATSAPP_API_VERSION = process.env.WHATSAPP_API_VERSION || 'v18.0';
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';
const WHATSAPP_WEBHOOK_SECRET = process.env.WHATSAPP_WEBHOOK_SECRET || '';

// Message templates (must be pre-approved by Meta)
const MESSAGE_TEMPLATES = {
  otp_verification: {
    name: 'otp_verification',
    language: { code: 'en' },
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: '{{1}}' }, // OTP code
        ],
      },
      {
        type: 'button',
        sub_type: 'url',
        index: 0,
        parameters: [
          { type: 'text', text: '{{1}}' }, // Same OTP for URL
        ],
      },
    ],
  },
  welcome: {
    name: 'welcome_message',
    language: { code: 'en' },
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: '{{1}}' }, // User name
        ],
      },
    ],
  },
  course_enrollment: {
    name: 'course_enrollment',
    language: { code: 'en' },
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: '{{1}}' }, // User name
          { type: 'text', text: '{{2}}' }, // Course title
        ],
      },
    ],
  },
  live_stream_starting: {
    name: 'live_stream_starting',
    language: { code: 'en' },
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: '{{1}}' }, // Course title
          { type: 'text', text: '{{2}}' }, // Start time
        ],
      },
    ],
  },
  payment_approved: {
    name: 'payment_approved',
    language: { code: 'en' },
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: '{{1}}' }, // User name
          { type: 'text', text: '{{2}}' }, // Course title
        ],
      },
    ],
  },
};

export interface SendMessageParams {
  to: string; // Phone number in E.164 format
  templateName: keyof typeof MESSAGE_TEMPLATES;
  parameters: string[];
}

export interface OTPResult {
  success: boolean;
  message?: string;
  otpId?: string;
  expiresAt?: Date;
  error?: string;
}


class WhatsAppService {
  private apiBaseUrl: string;
  private accessToken: string;
  private phoneNumberId: string;

  constructor() {
    this.apiBaseUrl = `https://graph.facebook.com/${WHATSAPP_API_VERSION}`;
    this.accessToken = WHATSAPP_ACCESS_TOKEN;
    this.phoneNumberId = WHATSAPP_PHONE_NUMBER_ID;
  }

  /**
   * Check if WhatsApp service is properly configured
   */
  isConfigured(): boolean {
    return !!(
      this.accessToken &&
      this.phoneNumberId &&
      WHATSAPP_WEBHOOK_SECRET
    );
  }

  /**
   * Generate a random 6-digit OTP
   */
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Hash OTP for secure storage
   */
  private hashOTP(otp: string): string {
    return crypto.createHash('sha256').update(otp).digest('hex');
  }

  /**
   * Verify OTP against hash
   */
  private verifyOTPHash(otp: string, hash: string): boolean {
    const computedHash = crypto.createHash('sha256').update(otp).digest('hex');
    return computedHash === hash;
  }

  /**
   * Send WhatsApp message using template
   */
  async sendMessage(params: SendMessageParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.isConfigured()) {
      return { success: false, error: 'WhatsApp service not configured' };
    }

    try {
      const { to, templateName, parameters } = params;
      const template = MESSAGE_TEMPLATES[templateName];

      if (!template) {
        return { success: false, error: `Template ${templateName} not found` };
      }

      // Replace template parameters
      const components = template.components.map((component: any) => ({
        ...component,
        parameters: component.parameters.map((param: any, index: number) => ({
          ...param,
          text: parameters[index] || param.text,
        })),
      }));

      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'template',
        template: {
          name: template.name,
          language: template.language,
          components,
        },
      };

      const response = await fetch(
        `${this.apiBaseUrl}/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('WhatsApp API error:', errorData);
        return {
          success: false,
          error: errorData.error?.message || `HTTP ${response.status}: Failed to send message`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        messageId: data.messages?.[0]?.id,
      };
    } catch (error) {
      console.error('WhatsApp service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send OTP to phone number
   */
  async sendOTP(userId: string, phoneNumber: string, purpose: 'verification' | 'password_reset' | 'login' = 'verification'): Promise<OTPResult> {
    await dbConnect();

    try {
      // Check for existing active OTP
      const existingOTP = await OTP.findActiveOTP(userId, purpose);
      if (existingOTP) {
        // Check if we can resend (cooldown: 60 seconds)
        const timeSinceLastOTP = Date.now() - existingOTP.createdAt.getTime();
        if (timeSinceLastOTP < 60000) {
          return {
            success: false,
            error: 'Please wait 60 seconds before requesting a new OTP',
          };
        }

        // Delete old OTP
        await OTP.deleteOne({ _id: existingOTP._id });
      }

      // Generate new OTP
      const otpCode = this.generateOTP();
      const hashedOTP = this.hashOTP(otpCode);

      // Create OTP record
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      const otp = await OTP.create({
        userId,
        phoneNumber,
        code: hashedOTP,
        purpose,
        expiresAt,
        attempts: 0,
        maxAttempts: 3,
        isVerified: false,
      });

      // Send WhatsApp message
      const sendResult = await this.sendMessage({
        to: phoneNumber,
        templateName: 'otp_verification',
        parameters: [otpCode],
      });

      if (!sendResult.success) {
        // Delete OTP record if sending failed
        await OTP.deleteOne({ _id: otp._id });
        return {
          success: false,
          error: sendResult.error || 'Failed to send OTP',
        };
      }

      return {
        success: true,
        message: 'OTP sent successfully',
        otpId: otp._id.toString(),
        expiresAt,
      };
    } catch (error) {
      console.error('Send OTP error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send OTP',
      };
    }
  }

  /**
   * Verify OTP
   */
  async verifyOTP(userId: string, code: string, purpose: 'verification' | 'password_reset' | 'login' = 'verification'): Promise<OTPResult> {
    await dbConnect();

    try {
      // Find active OTP
      const otp = await OTP.findActiveOTP(userId, purpose);

      if (!otp) {
        return {
          success: false,
          error: 'No active OTP found. Please request a new one.',
        };
      }

      // Check if expired
      if (new Date() > otp.expiresAt) {
        return {
          success: false,
          error: 'OTP has expired. Please request a new one.',
        };
      }

      // Check max attempts
      if (otp.attempts >= otp.maxAttempts) {
        return {
          success: false,
          error: 'Maximum attempts reached. Please request a new OTP.',
        };
      }

      // Verify code
      if (!this.verifyOTPHash(code, otp.code)) {
        otp.attempts += 1;
        await otp.save();
        const remainingAttempts = otp.maxAttempts - otp.attempts;
        return {
          success: false,
          error: `Invalid OTP. ${remainingAttempts} attempts remaining.`,
        };
      }

      // Mark as verified
      otp.isVerified = true;
      await otp.save();


      // If verification purpose, update user's phoneVerified
      if (purpose === 'verification') {
        await User.findByIdAndUpdate(userId, {
          phoneVerified: new Date(),
        });
      }

      return {
        success: true,
        message: 'OTP verified successfully',
      };
    } catch (error) {
      console.error('Verify OTP error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify OTP',
      };
    }
  }

  /**
   * Send welcome message
   */
  async sendWelcomeMessage(phoneNumber: string, userName: string): Promise<{ success: boolean; error?: string }> {
    return this.sendMessage({
      to: phoneNumber,
      templateName: 'welcome',
      parameters: [userName],
    });
  }

  /**
   * Send course enrollment notification
   */
  async sendCourseEnrollmentNotification(
    phoneNumber: string,
    userName: string,
    courseTitle: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendMessage({
      to: phoneNumber,
      templateName: 'course_enrollment',
      parameters: [userName, courseTitle],
    });
  }

  /**
   * Send live stream starting notification
   */
  async sendLiveStreamNotification(
    phoneNumber: string,
    courseTitle: string,
    startTime: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendMessage({
      to: phoneNumber,
      templateName: 'live_stream_starting',
      parameters: [courseTitle, startTime],
    });
  }

  /**
   * Send payment approved notification
   */
  async sendPaymentApprovedNotification(
    phoneNumber: string,
    userName: string,
    courseTitle: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendMessage({
      to: phoneNumber,
      templateName: 'payment_approved',
      parameters: [userName, courseTitle],
    });
  }

  /**
   * Verify webhook signature from Meta
   */
  verifyWebhookSignature(body: string, signature: string): boolean {
    if (!WHATSAPP_WEBHOOK_SECRET) {
      console.warn('Webhook secret not configured, skipping signature verification');
      return true;
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', WHATSAPP_WEBHOOK_SECRET)
        .update(body, 'utf8')
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      console.error('Webhook signature verification error:', error);
      return false;
    }
  }

  /**
   * Get webhook verification challenge response
   */
  getWebhookChallenge(mode: string, token: string, challenge: string): string | null {
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
    
    if (mode === 'subscribe' && token === verifyToken) {
      return challenge;
    }
    
    return null;
  }
}

// Export singleton instance
export const whatsappService = new WhatsAppService();

// Export class for testing or custom instances
export { WhatsAppService };

// Default export
export default whatsappService;
