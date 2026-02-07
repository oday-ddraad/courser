import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import connectDB from '@/lib/mongodb/connection';
import { Course, Enrollment } from '@/lib/mongodb/models';
import { Types } from 'mongoose';

// GET /api/courses/[id]/reviews - Get course reviews
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await connectDB();
    
    // Validate ID format
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid course ID' },
        { status: 400 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Find course
    const course = await Course.findById(id)
      .populate('reviews.userId', 'name avatar')
      .lean();
    
    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }
    
    // Sort reviews
    let reviews = [...course.reviews];
    reviews.sort((a: any, b: any) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });
    
    // Paginate
    const skip = (page - 1) * limit;
    const paginatedReviews = reviews.slice(skip, skip + limit);
    
    // Calculate rating distribution
    const ratingDistribution = [0, 0, 0, 0, 0]; // 1-5 stars
    reviews.forEach((review: any) => {
      if (review.rating >= 1 && review.rating <= 5) {
        ratingDistribution[review.rating - 1]++;
      }
    });
    
    return NextResponse.json({
      success: true,
      data: {
        reviews: paginatedReviews,
        statistics: {
          averageRating: course.rating,
          totalReviews: reviews.length,
          ratingDistribution: ratingDistribution.reverse(), // 5 to 1 stars
        },
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(reviews.length / limit),
          totalCount: reviews.length,
          limit,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// POST /api/courses/[id]/reviews - Add a review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
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
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid course ID' },
        { status: 400 }
      );
    }
    
    // Check if user is enrolled and has completed or made progress
    const enrollment = await Enrollment.findOne({
      userId: session.user.id,
      courseId: id,
      status: { $in: ['active', 'completed'] },
    });
    
    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: 'Must be enrolled to leave a review' },
        { status: 403 }
      );
    }
    
    // Check if user has already reviewed
    const course = await Course.findById(id);
    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }
    
    const existingReview = course.reviews.find(
      (review: any) => review.userId.toString() === session.user.id
    );
    
    if (existingReview) {
      return NextResponse.json(
        { success: false, error: 'You have already reviewed this course' },
        { status: 409 }
      );
    }
    
    const body = await request.json();
    const { rating, comment } = body;
    
    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }
    
    // Validate comment
    if (!comment || comment.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Comment is required' },
        { status: 400 }
      );
    }
    
    if (comment.trim().length > 1000) {
      return NextResponse.json(
        { success: false, error: 'Comment must be less than 1000 characters' },
        { status: 400 }
      );
    }
    
    // Add review
    const newReview = {
      userId: new Types.ObjectId(session.user.id),
      rating,
      comment: comment.trim(),
      createdAt: new Date(),
    };
    
    course.reviews.push(newReview);
    
    // Recalculate average rating
    course.calculateRating();
    
    await course.save();
    
    return NextResponse.json({
      success: true,
      data: newReview,
      message: 'Review added successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding review:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add review' },
      { status: 500 }
    );
  }
}

// PUT /api/courses/[id]/reviews - Update a review
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
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
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid course ID' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { rating, comment } = body;
    
    // Find course
    const course = await Course.findById(id);
    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }
    
    // Find user's review
    const reviewIndex = course.reviews.findIndex(
      (review: any) => review.userId.toString() === session.user.id
    );
    
    if (reviewIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      );
    }
    
    // Update review
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return NextResponse.json(
          { success: false, error: 'Rating must be between 1 and 5' },
          { status: 400 }
        );
      }
      course.reviews[reviewIndex].rating = rating;
    }
    
    if (comment !== undefined) {
      if (comment.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: 'Comment is required' },
          { status: 400 }
        );
      }
      if (comment.trim().length > 1000) {
        return NextResponse.json(
          { success: false, error: 'Comment must be less than 1000 characters' },
          { status: 400 }
        );
      }
      course.reviews[reviewIndex].comment = comment.trim();
    }
    
    // Recalculate average rating
    course.calculateRating();
    
    await course.save();
    
    return NextResponse.json({
      success: true,
      data: course.reviews[reviewIndex],
      message: 'Review updated successfully',
    });
  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update review' },
      { status: 500 }
    );
  }
}

// DELETE /api/courses/[id]/reviews - Delete a review
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
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
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid course ID' },
        { status: 400 }
      );
    }
    
    // Find course
    const course = await Course.findById(id);
    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }
    
    // Find and remove user's review
    const reviewIndex = course.reviews.findIndex(
      (review: any) => review.userId.toString() === session.user.id
    );
    
    if (reviewIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      );
    }
    
    course.reviews.splice(reviewIndex, 1);
    
    // Recalculate average rating
    course.calculateRating();
    
    await course.save();
    
    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete review' },
      { status: 500 }
    );
  }
}
