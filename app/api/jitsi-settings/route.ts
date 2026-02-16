import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import dbConnect from '@/lib/mongodb/connection';
import JitsiSettings from '@/lib/mongodb/models/JitsiSettings';

/**
 * GET /api/jitsi-settings
 * Get all Jitsi settings or the default one
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const getDefault = searchParams.get('default') === 'true';

    if (getDefault) {
      // Get default settings
      const defaultSettings = await JitsiSettings.findOne({ isDefault: true, isActive: true });
      
      if (!defaultSettings) {
        // Create default settings if none exist
        const newDefault = await JitsiSettings.create({
          labels: {
            en: {
              name: 'Default Settings',
              description: 'Optimized settings for best performance',
            },
            de: {
              name: 'Standardeinstellungen',
              description: 'Optimierte Einstellungen für beste Leistung',
            },
            ar: {
              name: 'الإعدادات الافتراضية',
              description: 'إعدادات محسّنة لأفضل أداء',
            },
          },
          isDefault: true,
          isActive: true,
          createdBy: session.user.id,
        });
        
        return NextResponse.json({
          success: true,
          settings: newDefault,
        });
      }
      
      return NextResponse.json({
        success: true,
        settings: defaultSettings,
      });
    }

    // Get all settings
    const settings = await JitsiSettings.find({ isActive: true })
      .sort({ isDefault: -1, createdAt: -1 })
      .populate('createdBy', 'name email');

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
 * POST /api/jitsi-settings
 * Create new Jitsi settings
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await dbConnect();

    const body = await request.json();
    
    // Validate required fields
    if (!body.labels?.en?.name || !body.labels?.de?.name || !body.labels?.ar?.name) {
      return NextResponse.json(
        { error: 'Name is required in all languages' },
        { status: 400 }
      );
    }

    const newSettings = await JitsiSettings.create({
      ...body,
      createdBy: session.user.id,
    });

    return NextResponse.json({
      success: true,
      settings: newSettings,
      message: 'Settings created successfully',
    });

  } catch (error) {
    console.error('Error creating Jitsi settings:', error);
    return NextResponse.json(
      { error: 'Failed to create settings' },
      { status: 500 }
    );
  }
}
