import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import connectDB from '@/lib/mongodb/connection';
import Upload from '@/lib/mongodb/models/Upload';
import User from '@/lib/mongodb/models/User';
import mongoose from 'mongoose';

// GET /api/file/[uploadId]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { path: pathSegments } = await params;
    
    // Validate path structure: [uploadId]
    if (pathSegments.length !== 1) {
      return NextResponse.json(
        { success: false, error: 'Invalid path. Expected: /api/file/[uploadId]' },
        { status: 400 }
      );
    }

    const [uploadId] = pathSegments;
    const requestingUserId = session.user.id;
    const userRole = session.user.role;

    // Validate uploadId format
    if (!mongoose.Types.ObjectId.isValid(uploadId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid upload ID' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Find upload in database
    const upload = await Upload.findById(uploadId);
    
    if (!upload) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    // Authorization check: user can access their own files, or admin can access any
    if (upload.userId.toString() !== requestingUserId && userRole !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Verify file is in user's documents (extra security check)
    const user = await User.findById(requestingUserId).select('documents');
    const hasDocument = user?.documents?.some(
      (doc: any) => doc.uploadId.toString() === uploadId
    );

    if (!hasDocument && userRole !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'File not associated with user' },
        { status: 403 }
      );
    }

    // Determine content type
    const contentTypeMap: Record<string, string> = {
      'application/pdf': 'application/pdf',
      'image/jpeg': 'image/jpeg',
      'image/jpg': 'image/jpeg',
      'image/png': 'image/png',
      'image/webp': 'image/webp',
    };
    const contentType = contentTypeMap[upload.mimeType] || 'application/octet-stream';

    // Return file with appropriate headers
    return new NextResponse(upload.fileData, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${upload.originalName}"`,
        'Content-Length': upload.size.toString(),
        'Cache-Control': 'private, max-age=3600',
      },
    });

  } catch (error: any) {
    console.error('File serving error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to serve file' },
      { status: 500 }
    );
  }
}
