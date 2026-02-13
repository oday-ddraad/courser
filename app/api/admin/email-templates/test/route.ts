import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import EmailTemplate from '@/lib/mongodb/models/EmailTemplate';
import { emailService } from '@/lib/services/email';

/**
 * POST /api/admin/email-templates/test
 * Send a test email using a template
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { templateId, to, variables, variant } = body;

    if (!templateId || !to) {
      return NextResponse.json(
        { success: false, error: 'Template ID and recipient email are required' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!emailService.validateEmail(to)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Fetch template
    const template = await EmailTemplate.findById(templateId);
    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    // Determine which content to use (main or A/B test variant)
    let subject = template.subject;
    let htmlContent = template.htmlContent;
    let textContent = template.textContent;

    if (variant && template.abTest?.enabled) {
      if (variant === 'A' && template.abTest.variantA) {
        subject = template.abTest.variantA.subject || subject;
        htmlContent = template.abTest.variantA.htmlContent || htmlContent;
        textContent = template.abTest.variantA.textContent || textContent;
      } else if (variant === 'B' && template.abTest.variantB) {
        subject = template.abTest.variantB.subject || subject;
        htmlContent = template.abTest.variantB.htmlContent || htmlContent;
        textContent = template.abTest.variantB.textContent || textContent;
      }
    }

    // Create template object for email service
    const emailTemplate = {
      name: template.name,
      subject,
      htmlContent,
      textContent,
      variables: template.variables,
    };

    // Send test email
    const result = await emailService.sendEmail({
      to,
      template: emailTemplate,
      variables: variables || {},
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully',
        emailId: result.id,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to send test email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send test email' },
      { status: 500 }
    );
  }
}
