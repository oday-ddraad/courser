import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { hasPermission } from '@/lib/auth/permissions';
import dbConnect from '@/lib/mongodb/connection';
import EmailTemplate from '@/lib/mongodb/models/EmailTemplate';
import emailService from '@/lib/services/email';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }


    await dbConnect();

    const body = await request.json();
    const {
      templateId,
      to,
      variables = {},
      from,
    } = body;

    // Validate required fields
    if (!templateId || !to) {
      return NextResponse.json(
        { success: false, error: 'Template ID and recipient email are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const recipients = Array.isArray(to) ? to : [to];
    for (const email of recipients) {
      if (!emailService.validateEmail(email)) {
        return NextResponse.json(
          { success: false, error: `Invalid email format: ${email}` },
          { status: 400 }
        );
      }
    }

    // Fetch template
    const template = await EmailTemplate.findById(templateId);
    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Email template not found' },
        { status: 404 }
      );
    }

    if (!template.isActive) {
      return NextResponse.json(
        { success: false, error: 'Email template is not active' },
        { status: 400 }
      );
    }

    // Validate required variables
    const missingVariables = template.variables.filter(
      variable => !variables[variable]
    );

    if (missingVariables.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing required variables: ${missingVariables.join(', ')}`
        },
        { status: 400 }
      );
    }

    // Send email
    const result = await emailService.sendEmail({
      to: recipients,
      template: {
        name: template.name,
        subject: template.subject,
        htmlContent: template.htmlContent,
        textContent: template.textContent,
        variables: template.variables,
      },
      variables,
      from,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: result.id,
        message: 'Email sent successfully',
      },
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
