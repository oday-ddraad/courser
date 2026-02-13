import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import EmailTemplate from '@/lib/mongodb/models/EmailTemplate';
import mongoose from 'mongoose';

/**
 * GET /api/admin/email-templates/[id]/ab-test
 * Get A/B test configuration for a template
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid template ID' },
        { status: 400 }
      );
    }

    const template = await EmailTemplate.findById(id).select('name category abTest');

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    // Only marketing templates can have A/B tests
    if (template.category !== 'marketing') {
      return NextResponse.json(
        { success: false, error: 'A/B testing is only available for marketing templates' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: template.abTest || {
        enabled: false,
        variantA: { subject: '', htmlContent: '', textContent: '' },
        variantB: { subject: '', htmlContent: '', textContent: '' },
        splitPercentage: 50,
        testDuration: 7,
        status: 'draft',
      },
    });
  } catch (error) {
    console.error('Error fetching A/B test:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch A/B test configuration' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/email-templates/[id]/ab-test
 * Create or update A/B test configuration
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid template ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      enabled,
      variantA,
      variantB,
      splitPercentage,
      testDuration,
      status,
    } = body;

    const template = await EmailTemplate.findById(id);

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    // Only marketing templates can have A/B tests
    if (template.category !== 'marketing') {
      return NextResponse.json(
        { success: false, error: 'A/B testing is only available for marketing templates' },
        { status: 400 }
      );
    }

    // Validate variant content if enabling
    if (enabled) {
      if (!variantA?.subject || !variantA?.htmlContent) {
        return NextResponse.json(
          { success: false, error: 'Variant A must have subject and HTML content' },
          { status: 400 }
        );
      }
      if (!variantB?.subject || !variantB?.htmlContent) {
        return NextResponse.json(
          { success: false, error: 'Variant B must have subject and HTML content' },
          { status: 400 }
        );
      }
    }

    // Update A/B test configuration
    template.abTest = {
      enabled: enabled || false,
      variantA: variantA || { subject: '', htmlContent: '', textContent: '' },
      variantB: variantB || { subject: '', htmlContent: '', textContent: '' },
      splitPercentage: splitPercentage || 50,
      testDuration: testDuration || 7,
      status: status || 'draft',
      startDate: status === 'running' && !template.abTest?.startDate 
        ? new Date() 
        : template.abTest?.startDate,
      winner: template.abTest?.winner || null,
      results: template.abTest?.results || {
        variantASent: 0,
        variantBSent: 0,
        variantAOpens: 0,
        variantBOpens: 0,
        variantAClicks: 0,
        variantBClicks: 0,
      },
    };

    await template.save();

    return NextResponse.json({
      success: true,
      message: 'A/B test configuration saved successfully',
      data: template.abTest,
    });
  } catch (error) {
    console.error('Error saving A/B test:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save A/B test configuration' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/email-templates/[id]/ab-test
 * Update A/B test status (start, pause, complete)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid template ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action, winner } = body;

    const template = await EmailTemplate.findById(id);

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    if (!template.abTest?.enabled) {
      return NextResponse.json(
        { success: false, error: 'A/B test is not enabled for this template' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'start':
        template.abTest.status = 'running';
        template.abTest.startDate = new Date();
        break;
      case 'pause':
        template.abTest.status = 'paused';
        break;
      case 'resume':
        template.abTest.status = 'running';
        break;
      case 'complete':
        if (!winner || (winner !== 'A' && winner !== 'B')) {
          return NextResponse.json(
            { success: false, error: 'Winner must be A or B' },
            { status: 400 }
          );
        }
        template.abTest.status = 'completed';
        template.abTest.winner = winner;
        
        // Apply winner as main template content
        if (winner === 'A' && template.abTest.variantA) {
          template.subject = template.abTest.variantA.subject;
          template.htmlContent = template.abTest.variantA.htmlContent;
          if (template.abTest.variantA.textContent) {
            template.textContent = template.abTest.variantA.textContent;
          }
        } else if (winner === 'B' && template.abTest.variantB) {
          template.subject = template.abTest.variantB.subject;
          template.htmlContent = template.abTest.variantB.htmlContent;
          if (template.abTest.variantB.textContent) {
            template.textContent = template.abTest.variantB.textContent;
          }
        }
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    await template.save();

    return NextResponse.json({
      success: true,
      message: `A/B test ${action}ed successfully`,
      data: template.abTest,
    });
  } catch (error) {
    console.error('Error updating A/B test:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update A/B test' },
      { status: 500 }
    );
  }
}
