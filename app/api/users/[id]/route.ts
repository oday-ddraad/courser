import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import connectDB from '@/lib/mongodb/connection';
import { User, Enrollment, Course } from '@/lib/mongodb/models';


// GET /api/users/[id] - Get user details with enrollments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await connectDB();

    const user = await User.findById(id).select('-password').lean();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user enrollments with course details
    const enrollments = await Enrollment.find({ userId: id })
      .populate({
        path: 'courseId',
        select: 'title slug thumbnail price currency level duration',
        model: Course,
      })
      .sort({ enrolledAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        _id: user._id.toString(),
        enrollments: enrollments.map(e => ({
          ...e,
          _id: e._id.toString(),
          courseId: e.courseId ? {
            ...e.courseId,
            _id: e.courseId._id.toString(),
          } : null,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { name, email, role, locale, country, isActive } = body;

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: id } });
      if (existingUser) {
        return NextResponse.json(
          { success: false, error: 'Email already in use by another user' },
          { status: 400 }
        );
      }
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (locale) user.locale = locale;
    if (country) user.country = country;
    if (isActive !== undefined) user.isActive = isActive;

    // Handle instructor profile
    if (role === 'instructor' && !user.instructorProfile) {
      user.instructorProfile = {
        bio: { en: '', de: '', ar: '' },
        specialization: [],
        rating: 0,
        totalStudents: 0,
        totalCourses: 0,
      };
    } else if (role !== 'instructor') {
      user.instructorProfile = undefined;
    }

    await user.save();

    // Return updated user without password
    const userResponse = user.toObject();
    const { password: _, ...userWithoutPassword } = userResponse;

    return NextResponse.json({
      success: true,
      data: {
        ...userWithoutPassword,
        _id: userResponse._id.toString(),
      },
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Prevent self-deletion
    if (id === session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findByIdAndDelete(id);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete related enrollments
    await Enrollment.deleteMany({ userId: id });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
