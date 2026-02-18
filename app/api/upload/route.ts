import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { 
  generateFilename, 
  validateFileType, 
  UPLOAD_CONFIG 
} from '@/lib/upload/config';
import connectDB from '@/lib/mongodb/connection';
import User from '@/lib/mongodb/models/User';
import Upload from '@/lib/mongodb/models/Upload';


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

    // Connect to database
    await connectDB();

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create upload document in MongoDB
    const upload = await Upload.create({
      userId: userId,
      filename: generateFilename(file.name),
      originalName: file.name,
      mimeType: file.type,
      fileData: buffer,
      size: file.size,
      documentName: documentName,
    });

    // Update user document with reference to upload
    await User.findByIdAndUpdate(userId, {
      $push: {
        documents: {
          name: documentName,
          uploadId: upload._id,
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
        uploadId: upload._id.toString(),
        fileType: file.type,
        size: file.size,
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
