import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import EmailTemplate from '@/lib/mongodb/models/EmailTemplate';
import EmailLog from '@/lib/mongodb/models/EmailLog';
import mongoose from 'mongoose';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/admin/email-templates/[id]/ab-test/results
 * Get A/B test results and statistics
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid template ID' },
        { status: 400 }
      );
    }

    const template = await EmailTemplate.findById(id).select('name abTest');

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

    // Get email logs for this template to calculate actual stats
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const emailLogs = await EmailLog.find({
      templateId: new mongoose.Types.ObjectId(id),
      sentAt: { $gte: thirtyDaysAgo },
    }).select('status metadata sentAt');

    // Calculate statistics from email logs
    let variantASent = 0;
    let variantBSent = 0;
    let variantAOpens = 0;
    let variantBOpens = 0;
    let variantAClicks = 0;
    let variantBClicks = 0;

    emailLogs.forEach((log) => {
      const variant = log.metadata?.abTestVariant;
      if (variant === 'A') {
        variantASent++;
        if (log.status === 'opened') variantAOpens++;
        if (log.status === 'clicked') variantAClicks++;
      } else if (variant === 'B') {
        variantBSent++;
        if (log.status === 'opened') variantBOpens++;
        if (log.status === 'clicked') variantBClicks++;
      }
    });

    // Update template with calculated results
    const results = {
      variantASent,
      variantBSent,
      variantAOpens,
      variantBOpens,
      variantAClicks,
      variantBClicks,
    };

    // Calculate rates
    const stats = {
      variantA: {
        sent: variantASent,
        opens: variantAOpens,
        clicks: variantAClicks,
        openRate: variantASent > 0 ? ((variantAOpens / variantASent) * 100).toFixed(2) : '0.00',
        clickRate: variantASent > 0 ? ((variantAClicks / variantASent) * 100).toFixed(2) : '0.00',
        clickToOpenRate: variantAOpens > 0 ? ((variantAClicks / variantAOpens) * 100).toFixed(2) : '0.00',
      },
      variantB: {
        sent: variantBSent,
        opens: variantBOpens,
        clicks: variantBClicks,
        openRate: variantBSent > 0 ? ((variantBOpens / variantBSent) * 100).toFixed(2) : '0.00',
        clickRate: variantBSent > 0 ? ((variantBClicks / variantBSent) * 100).toFixed(2) : '0.00',
        clickToOpenRate: variantBOpens > 0 ? ((variantBClicks / variantBOpens) * 100).toFixed(2) : '0.00',
      },
      totalSent: variantASent + variantBSent,
      testDuration: template.abTest.startDate 
        ? Math.ceil((Date.now() - new Date(template.abTest.startDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0,
    };

    // Determine winner based on open rate
    let suggestedWinner: 'A' | 'B' | null = null;
    if (variantASent > 10 && variantBSent > 10) {
      const openRateA = parseFloat(stats.variantA.openRate);
      const openRateB = parseFloat(stats.variantB.openRate);
      if (openRateA > openRateB) {
        suggestedWinner = 'A';
      } else if (openRateB > openRateA) {
        suggestedWinner = 'B';
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        abTest: template.abTest,
        results,
        stats,
        suggestedWinner,
      },
    });
  } catch (error) {
    console.error('Error fetching A/B test results:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch A/B test results' },
      { status: 500 }
    );
  }
}
