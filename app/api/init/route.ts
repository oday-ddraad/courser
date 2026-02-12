import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb/connection';
import { initializeEmailTemplates } from '@/lib/email/init-templates';

/**
 * Initialize email templates on app startup
 * This endpoint is called automatically when the app starts
 */
export async function GET() {
  try {
    // Connect to database
    await connectDB();
    
    // Initialize email templates
    const result = await initializeEmailTemplates();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Email templates initialized successfully',
        created: result.created,
        existing: result.existing,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to initialize email templates',
        error: result.error,
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in init endpoint:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// Also support POST for flexibility
export async function POST() {
  return GET();
}
