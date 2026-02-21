import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import connectDB from '@/lib/mongodb/connection';
import { Course } from '@/lib/mongodb/models';
import CourseCard from '@/components/courses/CourseCard';
import CourseFiltersWrapper from '@/components/courses/CourseFiltersWrapper';


interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'courses' });
  
  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function CoursesPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const searchParamsResolved = await searchParams;
  const t = await getTranslations({ locale, namespace: 'courses' });
  
  // Connect to database
  await connectDB();
  
  // Build query from search params
  const query: any = { isPublished: true };
  
  // Search
  const search = searchParamsResolved.search as string;
  if (search) {
    query.$or = [
      { [`title.${locale}`]: { $regex: search, $options: 'i' } },
      { [`description.${locale}`]: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } },
    ];
  }
  
  // Filters
  const category = searchParamsResolved.category as string;
  const level = searchParamsResolved.level as string;
  const minPrice = searchParamsResolved.minPrice as string;
  const maxPrice = searchParamsResolved.maxPrice as string;
  const rating = searchParamsResolved.rating as string;
  
  if (category) query.category = category;
  if (level) query.level = level;
  if (rating) query.rating = { $gte: parseInt(rating) };
  
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = parseFloat(minPrice);
    if (maxPrice) query.price.$lte = parseFloat(maxPrice);
  }
  
  // Sort
  const sortBy = (searchParamsResolved.sortBy as string) || 'createdAt';
  const sortOrder = (searchParamsResolved.sortOrder as string) || 'desc';
  const sort: any = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
  
  // Pagination
  const page = parseInt((searchParamsResolved.page as string) || '1');
  const limit = 12;
  const skip = (page - 1) * limit;
  
  // Fetch courses
  const [coursesData, totalCount, categories] = await Promise.all([
    Course.find(query)
      .populate('instructorId', 'name avatar')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Course.countDocuments(query),
    Course.distinct('category', { isPublished: true }),
  ]);
  
  // Serialize courses to convert ObjectIds to strings
  const courses = coursesData.map((course: any) => ({
    ...course,
    _id: course._id.toString(),
    instructorId: course.instructorId ? {
      _id: course.instructorId._id.toString(),
      name: course.instructorId.name,
      avatar: course.instructorId.avatar,
    } : undefined,
    lessons: course.lessons?.map((lesson: any) => ({
      _id: lesson._id.toString(),
      order: lesson.order,
      title: lesson.title,
      description: lesson.description,
      content: lesson.content,
      videoUrl: lesson.videoUrl,
      youtubeVideoId: lesson.youtubeVideoId,
      duration: lesson.duration,
      isLiveStream: lesson.isLiveStream,
      isPreview: lesson.isPreview,
      isPublished: lesson.isPublished,
    })) || [],
    reviews: course.reviews?.map((review: any) => ({
      _id: review._id.toString(),
      userId: review.userId?.toString(),
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt?.toISOString?.() || review.createdAt,
    })) || [],
    groups: course.groups?.map((group: any) => ({
      _id: group._id.toString(),
      name: group.name,
      description: group.description,
      order: group.order,
      maxStudents: group.maxStudents,
      studentIds: group.studentIds?.map((id: any) => id.toString()) || [],
      instructorId: group.instructorId?.toString(),
      createdAt: group.createdAt?.toISOString?.() || group.createdAt,
    })) || [],
    materials: course.materials?.map((material: any) => ({
      _id: material._id.toString(),
      name: material.name,
      type: material.type,
      fileUrl: material.fileUrl,
      fileSize: material.fileSize,
      isAccessibleAfterCourse: material.isAccessibleAfterCourse,
      uploadedBy: material.uploadedBy?.toString(),
      createdAt: material.createdAt?.toISOString?.() || material.createdAt,
    })) || [],
    createdAt: course.createdAt?.toISOString?.() || course.createdAt,
    updatedAt: course.updatedAt?.toISOString?.() || course.updatedAt,
    publishedAt: course.publishedAt?.toISOString?.() || course.publishedAt,
    approvalDate: course.approvalDate?.toISOString?.() || course.approvalDate,
    submittedForApprovalAt: course.submittedForApprovalAt?.toISOString?.() || course.submittedForApprovalAt,
    priceSetAt: course.priceSetAt?.toISOString?.() || course.priceSetAt,
    approvedBy: course.approvedBy?.toString(),
    priceSetBy: course.priceSetBy?.toString(),
  }));

  
  const totalPages = Math.ceil(totalCount / limit);

  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('description')}
          </p>
        </div>
        
        {/* Filters */}
        <CourseFiltersWrapper
          initialFilters={{
            search: search || '',
            category: category || '',
            level: level || '',
            minPrice: minPrice || '',
            maxPrice: maxPrice || '',
            rating: rating || '',
            sortBy,
            sortOrder: sortOrder as 'asc' | 'desc',
          }}
          categories={categories}
        />

        
        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-400">
            {t('showingResults', { count: courses.length, total: totalCount })}
          </p>
        </div>
        
        {/* Course Grid */}
        {courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {courses.map((course: any) => (
              <CourseCard key={course._id.toString()} course={course} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {t('noCoursesFound')}
            </p>
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            {page > 1 && (
              <a
                href={`/${locale}/courses?page=${page - 1}`}
                className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {t('previous')}
              </a>
            )}
            
            <span className="px-4 py-2 rounded-lg bg-blue-600 text-white">
              {page} / {totalPages}
            </span>
            
            {page < totalPages && (
              <a
                href={`/${locale}/courses?page=${page + 1}`}
                className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {t('next')}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
