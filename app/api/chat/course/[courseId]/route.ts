import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import connectDB from '@/lib/mongodb/connection';
import { ChatMessage, Course, Enrollment } from '@/lib/mongodb/models';
import { Types } from 'mongoose';

// GET /api/chat/course/[courseId] - Get chat messages for a course
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    
    const session = await getServerSession(authOptions);
    
    // Check authentication
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    // Validate ID format
    if (!Types.ObjectId.isValid(courseId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid course ID' },
        { status: 400 }
      );
    }
    
    // Check if user is enrolled or is instructor/admin
    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }
    
    const isInstructor = course.instructorId.toString() === session.user.id;
    const isAdmin = session.user.role === 'admin';
    
    if (!isInstructor && !isAdmin) {
      const enrollment = await Enrollment.findOne({
        userId: session.user.id,
        courseId: courseId,
        status: { $in: ['active', 'completed'] },
      });
      
      if (!enrollment) {
        return NextResponse.json(
          { success: false, error: 'Must be enrolled to access chat' },
          { status: 403 }
        );
      }
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const lessonId = searchParams.get('lessonId');
    
    // Build query
    const query: any = {
      courseId: new Types.ObjectId(courseId),
      deletedAt: null,
    };
    
    if (lessonId && Types.ObjectId.isValid(lessonId)) {
      query.lessonId = new Types.ObjectId(lessonId);
    }
    
    // Execute query with pagination
    const skip = (page - 1) * limit;
    
    const messages = await ChatMessage.find(query)
      .populate('userId', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    const totalCount = await ChatMessage.countDocuments(query);
    
    // Get pinned messages separately
    const pinnedMessages = await ChatMessage.find({
      ...query,
      isPinned: true,
    })
      .populate('userId', 'name avatar')
      .sort({ createdAt: -1 })
      .lean();
    
    return NextResponse.json({
      success: true,
      data: {
        messages: messages.reverse(), // Reverse to show oldest first
        pinnedMessages,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          limit,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch chat messages' },
      { status: 500 }
    );
  }
}

// POST /api/chat/course/[courseId] - Send a chat message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    
    const session = await getServerSession(authOptions);
    
    // Check authentication
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    // Validate ID format
    if (!Types.ObjectId.isValid(courseId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid course ID' },
        { status: 400 }
      );
    }
    
    // Check if user is enrolled or is instructor/admin
    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }
    
    const isInstructor = course.instructorId.toString() === session.user.id;
    const isAdmin = session.user.role === 'admin';
    
    if (!isInstructor && !isAdmin) {
      const enrollment = await Enrollment.findOne({
        userId: session.user.id,
        courseId: courseId,
        status: { $in: ['active', 'completed'] },
      });
      
      if (!enrollment) {
        return NextResponse.json(
          { success: false, error: 'Must be enrolled to send messages' },
          { status: 403 }
        );
      }
    }
    
    const body = await request.json();
    const { message, lessonId, attachments } = body;
    
    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }
    
    // Create chat message
    const chatMessage = await ChatMessage.create({
      courseId: new Types.ObjectId(courseId),
      lessonId: lessonId && Types.ObjectId.isValid(lessonId) ? new Types.ObjectId(lessonId) : undefined,
      userId: new Types.ObjectId(session.user.id),

      message: message.trim(),
      attachments: attachments || [],
      isInstructorMessage: isInstructor || isAdmin,
      isPinned: false,
      reactions: [],
    });
    
    // Populate user info for response
    await chatMessage.populate('userId', 'name avatar');
    
    return NextResponse.json({
      success: true,
      data: chatMessage,
    }, { status: 201 });
  } catch (error) {
    console.error('Error sending chat message:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
