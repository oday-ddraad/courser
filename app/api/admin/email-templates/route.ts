import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { hasPermission } from '@/lib/auth/permissions';
import dbConnect from '@/lib/mongodb/connection';
import EmailTemplate from '@/lib/mongodb/models/EmailTemplate';

// GET /api/admin/email-templates - List all templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const isActive = searchParams.get('isActive');
    
    const query: any = {};
    if (category) query.category = category;
    if (isActive !== null) query.isActive = isActive === 'true';
    
    const templates = await EmailTemplate.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error('Error fetching email templates:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch email templates' },
      { status: 500 }
    );
  }
}

// POST /api/admin/email-templates - Create new template
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
      name,
      description,
      subject,
      htmlContent,
      textContent,
      variables,
      category,
      isActive,
    } = body;

    // Validate required fields
    if (!name || !subject || !htmlContent) {
      return NextResponse.json(
        { success: false, error: 'Name, subject, and HTML content are required' },
        { status: 400 }
      );
    }

    // Check if template name already exists
    const existingTemplate = await EmailTemplate.findOne({ name });
    if (existingTemplate) {
      return NextResponse.json(
        { success: false, error: 'Template with this name already exists' },
        { status: 409 }
      );
    }

    const template = await EmailTemplate.create({
      name,
      description,
      subject,
      htmlContent,
      textContent,
      variables: variables || [],
      category: category || 'other',
      isActive: isActive !== undefined ? isActive : true,
      createdBy: session.user.id,
    });

    return NextResponse.json({
      success: true,
      data: template,
      message: 'Email template created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating email template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create email template' },
      { status: 500 }
    );
  }
}
