import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import EmailTemplate from '@/lib/mongodb/models/EmailTemplate';

/**
 * POST /api/admin/email-templates/preview
 * Generate a preview of an email template with sample variable values
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
    const { templateId, variables, variant } = body;

    if (!templateId) {
      return NextResponse.json(
        { success: false, error: 'Template ID is required' },
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

    // Replace variables in content
    const replaceVariables = (content: string, vars: Record<string, string>): string => {
      let result = content;
      for (const [key, value] of Object.entries(vars)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        result = result.replace(regex, value);
      }
      // Replace any remaining variables with placeholder
      result = result.replace(/{{[^}]+}}/g, '[variable]');
      return result;
    };

    const previewSubject = replaceVariables(subject, variables || {});
    const previewHtml = replaceVariables(htmlContent, variables || {});
    const previewText = textContent ? replaceVariables(textContent, variables || {}) : '';

    return NextResponse.json({
      success: true,
      data: {
        subject: previewSubject,
        htmlContent: previewHtml,
        textContent: previewText,
        templateName: template.name,
        category: template.category,
      },
    });
  } catch (error) {
    console.error('Error generating preview:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate preview' },
      { status: 500 }
    );
  }
}
