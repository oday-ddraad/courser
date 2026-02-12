import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { hasPermission } from '@/lib/auth/permissions';
import dbConnect from '@/lib/mongodb/connection';
import EmailTemplate from '@/lib/mongodb/models/EmailTemplate';
import mongoose from 'mongoose';

// GET /api/admin/email-templates/[id] - Get single template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await dbConnect();
    
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid template ID' },
        { status: 400 }
      );
    }

    const template = await EmailTemplate.findById(id)
      .populate('createdBy', 'name email');

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error('Error fetching email template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch email template' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/email-templates/[id] - Update template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await dbConnect();
    
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid template ID' },
        { status: 400 }
      );
    }

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

    // Check if new name conflicts with existing template
    if (name) {
      const existingTemplate = await EmailTemplate.findOne({
        name,
        _id: { $ne: id },
      });
      if (existingTemplate) {
        return NextResponse.json(
          { success: false, error: 'Template with this name already exists' },
          { status: 409 }
        );
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (subject !== undefined) updateData.subject = subject;
    if (htmlContent !== undefined) updateData.htmlContent = htmlContent;
    if (textContent !== undefined) updateData.textContent = textContent;
    if (variables !== undefined) updateData.variables = variables;
    if (category !== undefined) updateData.category = category;
    if (isActive !== undefined) updateData.isActive = isActive;

    const template = await EmailTemplate.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: template,
      message: 'Email template updated successfully',
    });
  } catch (error) {
    console.error('Error updating email template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update email template' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/email-templates/[id] - Delete template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await dbConnect();
    
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid template ID' },
        { status: 400 }
      );
    }

    const template = await EmailTemplate.findByIdAndDelete(id);

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email template deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting email template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete email template' },
      { status: 500 }
    );
  }
}
