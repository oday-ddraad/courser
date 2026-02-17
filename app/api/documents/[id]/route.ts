import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import connectDB from '@/lib/mongodb/connection';
import User from '@/lib/mongodb/models/User';
import { unlink } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

// DELETE - Remove a document
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;


    await connectDB();

    // Find user and check if document exists
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Find the document in user's documents array
    const document = user.documents?.find(
      (doc: any) => doc._id.toString() === documentId
    );

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Delete file from storage
    if (document.fileUrl) {
      try {
        const filePath = document.fileUrl.replace('/api/file/', 'uploads/');
        const fullPath = path.join(process.cwd(), filePath);
        
        if (existsSync(fullPath)) {
          await unlink(fullPath);
        }
      } catch (error) {
        console.error('Error deleting file from storage:', error);
        // Continue with database update even if file delete fails
      }
    }

    // Remove document from user's documents array
    await User.findByIdAndUpdate(userId, {
      $pull: {
        documents: { _id: documentId },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    });

  } catch (error: any) {
    console.error('Document delete error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete document: ' + error.message },
      { status: 500 }
    );
  }
}
