import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import dbConnect from '@/lib/mongodb/connection';
import JitsiSettings from '@/lib/mongodb/models/JitsiSettings';

/**
 * GET /api/jitsi-settings/[id]
 * Get specific Jitsi settings by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await dbConnect();

    const settings = await JitsiSettings.findById(id)

      .populate('createdBy', 'name email');

    if (!settings) {
      return NextResponse.json(
        { error: 'Settings not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      settings,
    });

  } catch (error) {
    console.error('Error fetching Jitsi settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/jitsi-settings/[id]
 * Update Jitsi settings
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await dbConnect();

    const body = await request.json();
    
    const settings = await JitsiSettings.findById(id);

    
    if (!settings) {
      return NextResponse.json(
        { error: 'Settings not found' },
        { status: 404 }
      );
    }

    // Update settings
    Object.assign(settings, body);
    await settings.save();

    return NextResponse.json({
      success: true,
      settings,
      message: 'Settings updated successfully',
    });

  } catch (error) {
    console.error('Error updating Jitsi settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/jitsi-settings/[id]
 * Delete Jitsi settings (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await dbConnect();

    const settings = await JitsiSettings.findById(id);

    
    if (!settings) {
      return NextResponse.json(
        { error: 'Settings not found' },
        { status: 404 }
      );
    }

    // Prevent deletion of default settings
    if (settings.isDefault) {
      return NextResponse.json(
        { error: 'Cannot delete default settings' },
        { status: 400 }
      );
    }

    // Soft delete
    settings.isActive = false;
    await settings.save();

    return NextResponse.json({
      success: true,
      message: 'Settings deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting Jitsi settings:', error);
    return NextResponse.json(
      { error: 'Failed to delete settings' },
      { status: 500 }
    );
  }
}
