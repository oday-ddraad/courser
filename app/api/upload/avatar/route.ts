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
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import connectDB from '@/lib/mongodb/connection';
import User from '@/lib/mongodb/models/User';
import { existsSync } from 'fs';

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

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size (2MB for avatars)
    const maxAvatarSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxAvatarSize) {
      return NextResponse.json(
        { success: false, error: 'Avatar size exceeds 2MB limit' },
        { status: 400 }
      );
    }

    // Validate file type (images only for avatars)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Allowed: JPG, PNG, WEBP, GIF' },
        { status: 400 }
      );
    }

    await connectDB();
    
    // Get current user to check for existing avatar
    const currentUser = await User.findById(userId).select('avatar');
    
    // Delete old avatar if exists
    if (currentUser?.avatar) {
      try {
        // Handle both old format (/api/file/...) and new format (/api/avatar/...)
        let oldAvatarPath: string;
        if (currentUser.avatar.startsWith('/api/avatar/')) {
          // New format: /api/avatar/[userId]/[filename]
          oldAvatarPath = currentUser.avatar.replace('/api/avatar/', 'uploads/documents/');
        } else if (currentUser.avatar.startsWith('/api/file/')) {
          // Old format: /api/file/documents/[userId]/[filename]
          oldAvatarPath = currentUser.avatar.replace('/api/file/', 'uploads/');
        } else {
          // Unknown format, skip deletion
          console.log('Unknown avatar URL format:', currentUser.avatar);
          oldAvatarPath = '';
        }
        
        if (oldAvatarPath) {
          const fullOldPath = path.join(process.cwd(), oldAvatarPath);
          if (existsSync(fullOldPath)) {
            await unlink(fullOldPath);
            console.log('Deleted old avatar:', fullOldPath);
          }
        }
      } catch (error) {
        console.error('Error deleting old avatar:', error);
        // Continue with upload even if delete fails
      }
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

    // Get file URL for database - use new avatar API route
    const avatarUrl = `/api/avatar/${userId}/${filename}`;


    // Update user avatar in database
    await User.findByIdAndUpdate(userId, {
      $set: { avatar: avatarUrl },
    });

    return NextResponse.json({
      success: true,
      message: 'Avatar uploaded successfully',
      avatar: avatarUrl,
    });

  } catch (error: any) {
    console.error('Avatar upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Upload failed: ' + error.message },
      { status: 500 }
    );
  }
}
