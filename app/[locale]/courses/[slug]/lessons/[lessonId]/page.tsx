import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import connectDB from '@/lib/mongodb/connection';
import { Course, Enrollment, ChatMessage } from '@/lib/mongodb/models';
import LessonPageLayout from '@/components/courses/LessonPageLayout';

interface Props {
  params: Promise<{ locale: string; slug: string; lessonId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, lessonId, locale } = await params;
  await connectDB();
  const course = await Course.findOne({ slug }).lean() as any;
  if (!course) return { title: 'Lesson Not Found' };
  const lesson = course.lessons?.find((l: any) => l._id.toString() === lessonId);
  const title = lesson?.title?.[locale] || lesson?.title?.en || 'Lesson';
  const courseTitle = course.title?.[locale] || course.title?.en || '';
  return { title: title + ' | ' + courseTitle };
}

export default async function LessonPage({ params }: Props) {
  const { slug, lessonId, locale } = await params;
  const session = await getServerSession(authOptions);

  await connectDB();

  const course = await Course.findOne({ slug })
    .populate('instructorIds', 'name avatar')
    .lean() as any;

  if (!course) notFound();

  const currentLesson = course.lessons?.find((l: any) => l._id.toString() === lessonId);
  if (!currentLesson) notFound();

  let enrollment: any = null;
  let isEnrolled = false;

  if (session?.user?.id) {
    enrollment = await Enrollment.findOne({
      userId: session.user.id,
      courseId: course._id,
      status: { $in: ['active', 'completed'] },
    }).lean();
    isEnrolled = !!enrollment;
  }

  const isAdmin = session?.user?.role === 'admin';
  const isInstructor = course.instructorIds?.some(
    (inst: any) => inst._id?.toString() === session?.user?.id
  );
  const canAccess = isAdmin || isInstructor || isEnrolled || currentLesson.isPreview;

  if (!canAccess && !session?.user?.id) {
    redirect('/' + locale + '/login?callbackUrl=/' + locale + '/courses/' + slug + '/lessons/' + lessonId);
  }

  let chatMessages: any[] = [];
  try {
    chatMessages = await ChatMessage.find({ courseId: course._id, lessonId: currentLesson._id })
      .populate('userId', 'name avatar')
      .sort({ createdAt: 1 })
      .limit(100)
      .lean();
  } catch { /* chat optional */ }

  const publishedLessons = course.lessons?.filter(
    (l: any) => l.isPublished || isAdmin || isInstructor
  ) || [];
  const currentIndex = publishedLessons.findIndex((l: any) => l._id.toString() === lessonId);
  const prevLesson = currentIndex > 0 ? publishedLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < publishedLessons.length - 1 ? publishedLessons[currentIndex + 1] : null;

  const serializedCourse = JSON.parse(JSON.stringify(course));
  const serializedLesson = JSON.parse(JSON.stringify(currentLesson));
  const serializedEnrollment = enrollment ? JSON.parse(JSON.stringify(enrollment)) : null;
  const serializedMessages = JSON.parse(JSON.stringify(chatMessages));

  const courseTitle = course.title?.[locale] || course.title?.en || '';
  const lessonTitle = currentLesson.title?.[locale] || currentLesson.title?.en || '';
  const lessonDescription = currentLesson.description?.[locale] || currentLesson.description?.en || '';
  const completedCount = serializedEnrollment?.completedLessons?.length || 0;
  const totalCount = publishedLessons.length;
  const isLiveLesson = !!(currentLesson.isLiveStream || course.isLiveStream);

  return (
    <LessonPageLayout
      locale={locale}
      slug={slug}
      lessonId={lessonId}
      courseTitle={courseTitle}
      lessonTitle={lessonTitle}
      lessonDescription={lessonDescription}
      serializedCourse={serializedCourse}
      serializedLesson={serializedLesson}
      serializedEnrollment={serializedEnrollment}
      serializedMessages={serializedMessages}
      isEnrolled={isEnrolled}
      isAdmin={isAdmin}
      isInstructor={!!isInstructor}
      isLiveLesson={isLiveLesson}
      userRole={session?.user?.role as 'admin' | 'instructor' | 'user' | undefined}
      prevLesson={prevLesson ? { _id: prevLesson._id.toString(), title: prevLesson.title } : null}
      nextLesson={nextLesson ? { _id: nextLesson._id.toString(), title: nextLesson.title } : null}
      completedCount={completedCount}
      totalCount={totalCount}
      resources={currentLesson.resources || []}
      googleDriveLinks={currentLesson.googleDriveLinks || []}
    />
  );
}
