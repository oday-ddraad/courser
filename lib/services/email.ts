import { Resend } from 'resend';
import dbConnect from '@/lib/mongodb/connection';
import EmailLog from '@/lib/mongodb/models/EmailLog';
import EmailSettings from '@/lib/mongodb/models/EmailSettings';
import EmailTemplate from '@/lib/mongodb/models/EmailTemplate';

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
  abTestVariant?: 'A' | 'B'; // Optional A/B test variant
}

export interface EmailLogEntry {
  to: string;
  subject: string;
  templateName: string;
  status: 'sent' | 'failed' | 'bounced' | 'opened' | 'clicked';
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
   * Determine A/B test variant for a recipient
   */
  private async determineABTestVariant(
    templateId: string,
    templateData: any
  ): Promise<'A' | 'B' | null> {
    if (!templateData?.abTest?.enabled || templateData.abTest.status !== 'running') {
      return null;
    }

    // Check if test duration has expired
    if (templateData.abTest.startDate && templateData.abTest.testDuration) {
      const startDate = new Date(templateData.abTest.startDate);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + templateData.abTest.testDuration);
      
      if (new Date() > endDate) {
        // Test has expired, auto-complete it
        await this.completeExpiredTest(templateId, templateData);
        return null;
      }
    }

    // Randomly assign variant based on split percentage
    const random = Math.random() * 100;
    return random < (templateData.abTest.splitPercentage || 50) ? 'A' : 'B';
  }

  /**
   * Complete an expired A/B test
   */
  private async completeExpiredTest(templateId: string, templateData: any): Promise<void> {
    try {
      // Get current results
      const results = templateData.abTest.results || {
        variantASent: 0,
        variantBSent: 0,
        variantAOpens: 0,
        variantBOpens: 0,
      };

      // Determine winner based on open rate
      let winner: 'A' | 'B' | null = null;
      if (results.variantASent > 0 && results.variantBSent > 0) {
        const openRateA = results.variantAOpens / results.variantASent;
        const openRateB = results.variantBOpens / results.variantBSent;
        winner = openRateA >= openRateB ? 'A' : 'B';
      }

      // Update template
      await EmailTemplate.findByIdAndUpdate(templateId, {
        'abTest.status': 'completed',
        'abTest.winner': winner,
      });

      // Apply winner content if available
      if (winner && templateData.abTest[`variant${winner}`]) {
        const winnerContent = templateData.abTest[`variant${winner}`];
        await EmailTemplate.findByIdAndUpdate(templateId, {
          subject: winnerContent.subject,
          htmlContent: winnerContent.htmlContent,
          textContent: winnerContent.textContent,
        });
      }
    } catch (error) {
      console.error('Error completing expired A/B test:', error);
    }
  }

  /**
   * Send email using a template
   */
  async sendEmail(params: SendEmailParams): Promise<{ success: boolean; id?: string; error?: string; variant?: 'A' | 'B' }> {
    await dbConnect();

    try {
      const { to, template, variables, from, abTestVariant } = params;

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

      // Get template data for A/B testing
      let templateData: any = null;
      let selectedVariant: 'A' | 'B' | null = abTestVariant || null;

      if ((template as any)._id) {
        templateData = await EmailTemplate.findById((template as any)._id);
        
        // Determine A/B test variant if not specified
        if (!selectedVariant && templateData?.abTest?.enabled) {
          selectedVariant = await this.determineABTestVariant(
            (template as any)._id.toString(),
            templateData
          );
        }
      }

      // Use variant content if applicable
      let subject = template.subject;
      let htmlContent = template.htmlContent;
      let textContent = template.textContent;

      if (selectedVariant && templateData?.abTest?.[`variant${selectedVariant}`]) {
        const variantContent = templateData.abTest[`variant${selectedVariant}`];
        subject = variantContent.subject || subject;
        htmlContent = variantContent.htmlContent || htmlContent;
        textContent = variantContent.textContent || textContent;
      }

      // Replace variables in subject and content
      const finalSubject = this.replaceVariables(subject, variables);
      const finalHtmlContent = this.replaceVariables(htmlContent, variables);
      const finalTextContent = textContent
        ? this.replaceVariables(textContent, variables)
        : undefined;

      // Send email via Resend
      const { data, error } = await resend.emails.send({
        from: from || settings.defaultFromEmail,
        to: Array.isArray(to) ? to : [to],
        subject: finalSubject,
        html: finalHtmlContent,
        text: finalTextContent,
      });

      if (error) {
        console.error('Resend email error:', error);

        // Log failed email
        await EmailLog.create({
          to: Array.isArray(to) ? to.join(', ') : to,
          from: from || settings.defaultFromEmail,
          subject: finalSubject,
          templateId: (template as any)._id,
          templateName: template.name,
          status: 'failed',
          error: error.message,
          sentAt: new Date(),
          metadata: {
            abTestVariant: selectedVariant,
            variables: Object.keys(variables),
          },
        });

        return { success: false, error: error.message };
      }

      // Log successful email
      await EmailLog.create({
        to: Array.isArray(to) ? to.join(', ') : to,
        from: from || settings.defaultFromEmail,
        subject: finalSubject,
        templateId: (template as any)._id,
        templateName: template.name,
        status: 'sent',
        resendId: data?.id,
        sentAt: new Date(),
        metadata: {
          abTestVariant: selectedVariant,
          variables: Object.keys(variables),
        },
      });

      // Update A/B test results if variant was used
      if (selectedVariant && templateData) {
        const resultField = selectedVariant === 'A' ? 'variantASent' : 'variantBSent';
        await EmailTemplate.findByIdAndUpdate(
          (template as any)._id,
          {
            $inc: { [`abTest.results.${resultField}`]: 1 },
          }
        );
      }

      // Increment counters
      await settings.incrementSent();

      return { success: true, id: data?.id, variant: selectedVariant || undefined };
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
  ): Promise<{ success: boolean; sent: number; failed: number; errors: string[]; variantStats: { A: number; B: number } }> {
    const results = {
      success: true,
      sent: 0,
      failed: 0,
      errors: [] as string[],
      variantStats: { A: 0, B: 0 },
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
          if (result.variant) {
            results.variantStats[result.variant]++;
          }
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
