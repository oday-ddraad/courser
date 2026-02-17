import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { UPLOAD_CONFIG } from '@/lib/upload/config';
import { promises as fs } from 'fs';
import path from 'path';
import connectDB from '@/lib/mongodb/connection';
import User from '@/lib/mongodb/models/User';

// GET /api/file/documents/[userId]/[filename]
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
    
    // Validate path structure: documents/[userId]/[filename]
    if (pathSegments.length !== 3 || pathSegments[0] !== 'documents') {
      return NextResponse.json(
        { success: false, error: 'Invalid path' },
        { status: 400 }
      );
    }

    const [, fileOwnerId, filename] = pathSegments;
    const requestingUserId = session.user.id;
    const userRole = session.user.role;

    // Authorization check: user can access their own files, or admin can access any
    if (fileOwnerId !== requestingUserId && userRole !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Verify file exists in user's document list
    await connectDB();
    const user = await User.findById(fileOwnerId).select('documents');
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if file is in user's documents
    const fileExists = user.documents?.some(
      (doc: any) => doc.fileUrl === `/api/file/documents/${fileOwnerId}/${filename}`
    );

    if (!fileExists && userRole !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    // Construct file path
    const filePath = path.join(UPLOAD_CONFIG.uploadDir, 'documents', fileOwnerId, filename);

    // Check if file exists on disk
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json(
        { success: false, error: 'File not found on disk' },
        { status: 404 }
      );
    }

    // Read file
    const fileBuffer = await fs.readFile(filePath);

    // Determine content type
    const ext = path.extname(filename).toLowerCase();
    const contentTypeMap: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
    };
    const contentType = contentTypeMap[ext] || 'application/octet-stream';

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${filename}"`,
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
