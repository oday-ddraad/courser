import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { 
  ensureUserDir, 
  generateFilename, 
  validateFileType, 
  UPLOAD_CONFIG,
  getFileUrl 
} from '@/lib/upload/config';
import { writeFile } from 'fs/promises';
import path from 'path';
import connectDB from '@/lib/mongodb/connection';
import User from '@/lib/mongodb/models/User';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const documentName = formData.get('documentName') as string || 'Document';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > UPLOAD_CONFIG.maxFileSize) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 5MB limit' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!validateFileType(file.type, file.name)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Allowed: PDF, JPG, PNG, WEBP' },
        { status: 400 }
      );
    }

    // Generate secure filename
    const filename = generateFilename(file.name);
    
    // Ensure user directory exists
    const userDir = await ensureUserDir(userId);
    const filePath = path.join(userDir, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Get file URL for database
    const fileUrl = getFileUrl(userId, filename);

    // Update user document in database
    await connectDB();
    await User.findByIdAndUpdate(userId, {
      $push: {
        documents: {
          name: documentName,
          fileUrl: fileUrl,
          fileType: file.type,
          uploadedAt: new Date(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        name: documentName,
        fileUrl: fileUrl,
        fileType: file.type,
      },
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Upload failed: ' + error.message },
      { status: 500 }
    );
  }
}
