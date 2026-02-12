import { Resend } from 'resend';
import dbConnect from '@/lib/mongodb/connection';
import EmailLog from '@/lib/mongodb/models/EmailLog';
import EmailSettings from '@/lib/mongodb/models/EmailSettings';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailTemplate {
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  variables: string[]; // e.g., ['name', 'courseName', 'date']
}

export interface SendEmailParams {
  to: string | string[];
  template: EmailTemplate;
  variables: Record<string, string>;
  from?: string;
}

export interface EmailLogEntry {
  to: string;
  subject: string;
  templateName: string;
  status: 'sent' | 'failed' | 'bounced';
  error?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

class EmailService {
  private fromEmail: string;

  constructor() {
    this.fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@yourdomain.com';
  }

  /**
   * Replace template variables with actual values
   */
  private replaceVariables(content: string, variables: Record<string, string>): string {
    let result = content;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value);
    }
    return result;
  }

  /**
   * Send email using a template
   */
  async sendEmail(params: SendEmailParams): Promise<{ success: boolean; id?: string; error?: string }> {
    await dbConnect();

    try {
      const { to, template, variables, from } = params;

      // Get email settings
      const settings = await EmailSettings.getSettings();

      // Check if email system is enabled
      if (!settings.emailEnabled) {
        return { success: false, error: 'Email system is disabled' };
      }

      // Check sending limits
      if (settings.isDailyLimitReached()) {
        return { success: false, error: 'Daily sending limit reached' };
      }
      if (settings.isMonthlyLimitReached()) {
        return { success: false, error: 'Monthly sending limit reached' };
      }

      // Replace variables in subject and content
      const subject = this.replaceVariables(template.subject, variables);
      const htmlContent = this.replaceVariables(template.htmlContent, variables);
      const textContent = template.textContent
        ? this.replaceVariables(template.textContent, variables)
        : undefined;

      // Send email via Resend
      const { data, error } = await resend.emails.send({
        from: from || settings.defaultFromEmail,
        to: Array.isArray(to) ? to : [to],
        subject,
        html: htmlContent,
        text: textContent,
      });

      if (error) {
        console.error('Resend email error:', error);

        // Log failed email
        await EmailLog.create({
          to: Array.isArray(to) ? to.join(', ') : to,
          from: from || settings.defaultFromEmail,
          subject,
          templateId: (template as any)._id,
          templateName: template.name,
          status: 'failed',
          error: error.message,
          sentAt: new Date(),
        });

        return { success: false, error: error.message };
      }

      // Log successful email
      await EmailLog.create({
        to: Array.isArray(to) ? to.join(', ') : to,
        from: from || settings.defaultFromEmail,
        subject,
        templateId: (template as any)._id,
        templateName: template.name,
        status: 'sent',
        resendId: data?.id,
        sentAt: new Date(),
      });

      // Increment counters
      await settings.incrementSent();

      return { success: true, id: data?.id };
    } catch (error) {
      console.error('Email service error:', error);

      // Try to log the error if we have the params
      try {
        const { to, template, from } = params;
        const settings = await EmailSettings.getSettings();
        await EmailLog.create({
          to: Array.isArray(to) ? to.join(', ') : to,
          from: from || settings.defaultFromEmail,
          subject: template.subject,
          templateId: (template as any)._id,
          templateName: template.name,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          sentAt: new Date(),
        });
      } catch (logError) {
        console.error('Failed to log email error:', logError);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send bulk emails
   */
  async sendBulkEmails(
    recipients: string[],
    template: EmailTemplate,
    variables: Record<string, string>[],
    from?: string
  ): Promise<{ success: boolean; sent: number; failed: number; errors: string[] }> {
    const results = {
      success: true,
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Send emails in batches of 100 (Resend limit)
    const batchSize = 100;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      const batchVariables = variables.slice(i, i + batchSize);

      const promises = batch.map((recipient, index) =>
        this.sendEmail({
          to: recipient,
          template,
          variables: batchVariables[index] || {},
          from,
        })
      );

      const batchResults = await Promise.all(promises);

      batchResults.forEach((result) => {
        if (result.success) {
          results.sent++;
        } else {
          results.failed++;
          if (result.error) results.errors.push(result.error);
        }
      });
    }

    results.success = results.failed === 0;
    return results;
  }

  /**
   * Validate email address format
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get sending limits from Resend
   */
  async getSendingLimits(): Promise<{
    dailyLimit: number;
    monthlyLimit: number;
    dailySent: number;
    monthlySent: number;
  } | null> {
    try {
      // Resend doesn't provide a direct API for limits, 
      // so we track this in our own database
      return null;
    } catch (error) {
      console.error('Error getting sending limits:', error);
      return null;
    }
  }
}

export const emailService = new EmailService();
export default emailService;
