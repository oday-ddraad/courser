import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb/connection';
import { Category, Course } from '@/lib/mongodb/models';
import { authOptions } from '@/lib/auth/config';
import { hasPermission } from '@/lib/auth/permissions';

// PUT /api/admin/categories/[id] - Update a category
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !hasPermission(session.user.role, 'course.manage')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await connectDB();
    
    const body = await request.json();
    const { id } = await params;

    
    // Find category
    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }
    
    // Check if new slug conflicts with another category
    if (body.slug && body.slug !== category.slug) {
      const existingCategory = await Category.findOne({ 
        slug: body.slug,
        _id: { $ne: id }
      });
      if (existingCategory) {
        return NextResponse.json(
          { success: false, error: 'Category with this slug already exists' },
          { status: 409 }
        );
      }
    }
    
    // Update fields
    if (body.name) {
      category.name.en = body.name.en || category.name.en;
      category.name.de = body.name.de || category.name.de;
      category.name.ar = body.name.ar || category.name.ar;
    }
    
    if (body.slug) {
      const oldSlug = category.slug;
      category.slug = body.slug.toLowerCase().replace(/\s+/g, '-');
      
      // Update courses that use this category
      if (oldSlug !== category.slug) {
        await Course.updateMany(
          { category: oldSlug },
          { category: category.slug }
        );
      }
    }
    
    if (body.description) {
      if (!category.description) {
        category.description = { en: '', de: '', ar: '' };
      }
      category.description.en = body.description.en || '';
      category.description.de = body.description.de || '';
      category.description.ar = body.description.ar || '';
    }

    if (body.icon !== undefined) category.icon = body.icon;
    if (body.color !== undefined) category.color = body.color;
    if (body.isActive !== undefined) category.isActive = body.isActive;
    if (body.sortOrder !== undefined) category.sortOrder = body.sortOrder;
    
    await category.save();
    
    // Create response object with serialized values
    const responseData = {
      _id: category._id.toString(),
      name: category.name,
      slug: category.slug,
      description: category.description,
      icon: category.icon,
      color: category.color,
      isActive: category.isActive,
      sortOrder: category.sortOrder,
      createdAt: category.createdAt?.toISOString(),
      updatedAt: category.updatedAt?.toISOString(),
    };
    
    return NextResponse.json({
      success: true,
      data: responseData,
    });

  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/categories/[id] - Delete a category
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !hasPermission(session.user.role, 'course.manage')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await connectDB();
    
    const { id } = await params;

    
    // Find category
    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }
    
    // Check if there are courses using this category
    const courseCount = await Course.countDocuments({ category: category.slug });
    if (courseCount > 0) {
      return NextResponse.json(
        { success: false, error: `Cannot delete category. ${courseCount} course(s) are using this category.` },
        { status: 400 }
      );
    }
    
    await Category.findByIdAndDelete(id);
    
    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
