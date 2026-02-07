import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import connectDB from '@/lib/mongodb/connection';
import { User, Enrollment } from '@/lib/mongodb/models';

// POST /api/users/bulk-delete - Delete multiple users
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await connectDB();
    const { userIds } = await request.json();

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No user IDs provided' },
        { status: 400 }
      );
    }

    // Prevent admin from deleting themselves
    const filteredIds = userIds.filter(id => id !== session.user.id);
    
    if (filteredIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Delete users
    const deleteResult = await User.deleteMany({
      _id: { $in: filteredIds },
    });

    // Delete their enrollments
    await Enrollment.deleteMany({
      userId: { $in: filteredIds },
    });

    return NextResponse.json({
      success: true,
      message: `Deleted ${deleteResult.deletedCount} users`,
      deletedCount: deleteResult.deletedCount,
    });
  } catch (error) {
    console.error('Error bulk deleting users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete users' },
      { status: 500 }
    );
  }
}
