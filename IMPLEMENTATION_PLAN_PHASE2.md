# Implementation Plan: Phase 2 - Course System (Week 3-4)

## 📋 Overview

This plan implements Phase 2 of the course system as outlined in `COMPLETE_SYSTEM_STRATEGY.md`. The focus is on core course functionality including models, creation, listing, detail pages, multi-language support, video player, live streaming with Jitsi, live chat, and progress tracking.

**Key Requirements:**
- Multi-language support (English, German, Arabic) for all content
- Role-based permissions (Admin, Instructor, User)
- JaaC (Jitsi as a Component) integration for internal live streaming
- Live streams launched internally within the website
- Next.js App Router with TypeScript
- pnpm package manager
- MongoDB with Mongoose

## 🔍 Current State Analysis



**Models:**
- `Course.ts`: Basic course model with lessons, materials, groups. Missing some fields from strategy (reviews, publishedAt, etc.)
- `Enrollment.ts`: Enrollment model with progress tracking
- `User.ts`: User model (assumed exists)
- `Notification.ts`: Notification model

**API Routes:**
- `/api/courses`: GET (listing with search/filters), POST (creation)
- `/api/courses/[id]`: Course details (assumed)
- `/api/courses/[id]/groups/[groupId]/assign`: Group assignment

**Components:**
- `VideoPlayer.tsx`: Video player component
- `JitsiLiveStream.tsx`: Jitsi live stream integration
- `LiveChat.tsx`: Live chat component

**Pages:**
- `/[locale]/courses/[slug]/page.tsx`: Basic course detail page
- `/[locale]/dashboard/instructor/courses/new/page.tsx`: Course creation form

**Services:**
- `jitsi.ts`: Jitsi service (to be updated for JaaC integration)
- `notifications.ts`: Notification service

### Gaps vs Strategy

**Missing/Incomplete:**
- Course reviews and ratings
- Published date tracking
- Enhanced search with text indexes
- Course progress tracking UI
- Lesson player with progress updates
- Live stream scheduling and notifications
- Chat message persistence
- Multi-language UI improvements
- Course listing page
- Search and filtering UI
- Progress tracking API

## 📝 Implementation Plan

### 1. Enhanced Course Models (Day 1-2)

**Tasks:**
- [] Update `Course.ts` model to match strategy
  - Add `publishedAt` field
  - Add reviews array
  - Ensure all multi-language fields are present
  - Add text indexes for search
- [] Create `ChatMessage.ts` model for persistent chat
- [] Update `Enrollment.ts` if needed for progress tracking
- [] Add missing indexes for performance
- [] Update model exports in index.ts

**Files to Create/Modify:**
- `lib/mongodb/models/Course.ts`
- `lib/mongodb/models/ChatMessage.ts` (new)
- `lib/mongodb/models/Enrollment.ts` (minor updates)
- `lib/mongodb/models/index.ts` (updated exports)

### 2. Course Listing and Search (Day 3-4)

**Tasks:**
- [] Create course listing page with search and filters
- [] Implement advanced search API
- [] Add course cards component
- [] Add pagination component
- [] Implement category and level filters
- [] Add filter API endpoints (categories, instructors)

**Files to Create:**
- `app/[locale]/courses/page.tsx` (course listing)
- `components/courses/CourseCard.tsx`
- `components/courses/CourseFilters.tsx`
- `components/courses/Pagination.tsx`
- `app/api/courses/categories/route.ts`
- `app/api/courses/instructors/route.ts`

**Files to Modify:**
- `app/api/courses/route.ts` (enhance search)

### 3. Enhanced Course Detail Pages (Day 5-6)

**Tasks:**
- [ ] Implement full course detail page
- [ ] Add course enrollment logic
- [ ] Create lesson navigation
- [ ] Add course reviews display
- [ ] Implement instructor info section

**Files to Create:**
- `app/[locale]/courses/[slug]/lessons/[lessonId]/page.tsx` (lesson player)
- `components/courses/CourseDetail.tsx`
- `components/courses/LessonNavigation.tsx`
- `components/courses/CourseReviews.tsx`
- `components/courses/InstructorInfo.tsx`

**Files to Modify:**
- `app/[locale]/courses/[slug]/page.tsx` (enhance course page)
- `app/api/courses/[id]/route.ts` (add enrollment logic)

### 4. Lesson Player and Progress Tracking (Day 7-8)

**Tasks:**
- [ ] Create lesson player component with progress tracking
- [ ] Implement video player with progress saving
- [ ] Add live stream player integration
- [ ] Create progress tracking API
- [ ] Add lesson completion logic

**Files to Create:**
- `components/courses/LessonPlayer.tsx`
- `components/courses/ProgressTracker.tsx`
- `app/api/progress/route.ts` (progress tracking API)
- `app/api/enrollments/route.ts` (enrollment management)

**Files to Modify:**
- `components/courses/VideoPlayer.tsx` (add progress tracking)
- `components/courses/JitsiLiveStream.tsx` (enhance integration)

### 5. Live Streaming and Chat (Day 9-10)

**Tasks:**
- [ ] Implement live stream scheduling
- [ ] Add notification system for live streams
- [ ] Enhance live chat with persistence
- [ ] Create chat API routes
- [ ] Add real-time chat updates

**Files to Create:**
- `app/api/chat/route.ts` (chat API)
- `app/api/chat/course/[courseId]/route.ts`
- `components/courses/LiveChat.tsx` (enhance existing)
- `lib/services/chat.ts` (chat service)

**Files to Modify:**
- `lib/services/jitsi.ts` (update for JaaC integration and internal live streaming)
- `lib/services/notifications.ts` (add live stream notifications)

### 6. Multi-language Enhancements (Day 11-12)

**Tasks:**
- [ ] Ensure all components support RTL for Arabic
- [ ] Add language switching in course content
- [ ] Implement dynamic content loading based on locale
- [ ] Add translations for all new components
- [ ] Test multi-language functionality

**Files to Create/Modify:**
- `messages/ar.json`, `messages/de.json`, `messages/en.json` (add new keys)
- Various component files (add RTL support)
- Course content rendering logic

### 7. Testing and Polish (Day 13-14)

**Tasks:**
- [ ] Test all course functionality
- [ ] Add error handling
- [ ] Implement loading states
- [ ] Add responsive design improvements
- [ ] Performance optimization

## 🛠️ Technical Implementation Details

### Database Schema Updates

**Course Model Enhancements:**
```typescript
// Add to Course.ts
publishedAt?: Date;
reviews: Review[];
// Ensure text indexes
CourseSchema.index({ 'title.en': 'text', 'title.de': 'text', 'title.ar': 'text' });
CourseSchema.index({ 'description.en': 'text', 'description.de': 'text', 'description.ar': 'text' });
```

**ChatMessage Model:**
```typescript
{
  _id: ObjectId,
  courseId: ObjectId,
  lessonId?: ObjectId,
  userId: ObjectId,
  message: string,
  attachments: [],
  isInstructorMessage: boolean,
  isPinned: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### API Routes Structure

**New API Routes:**
- `GET/POST /api/courses/[id]/enroll` - Course enrollment
- `GET/PUT /api/progress` - Progress tracking
- `GET/POST /api/chat/course/[courseId]` - Course chat
- `GET/POST /api/courses/[id]/reviews` - Course reviews

### Component Architecture

**Lesson Player Flow:**
```
LessonPlayer
├── VideoPlayer (for pre-recorded)
│   ├── Progress tracking
│   └── Playback controls
├── JitsiLiveStream (for live)
│   ├── Meeting join
│   └── Stream controls
└── LiveChat (for both)
    ├── Message display
    ├── Message input
    └── Real-time updates
```

### Progress Tracking Logic

**Progress Update Flow:**
1. User accesses lesson → Track `lastAccessedAt`
2. Video plays → Save progress every 30 seconds
3. Video completes → Mark lesson as completed
4. All lessons completed → Mark course as completed
5. Send completion notification

## 📋 Dependencies and Packages

**New Packages to Install:**
```bash
pnpm add react-player          # Enhanced video player
pnpm add @headlessui/react     # UI components
pnpm add react-intersection-observer  # Lazy loading
pnpm add socket.io-client      # Real-time chat (if needed)
```

## 🔐 Permission Requirements

**Role-based Access:**
- **Admin**: View all courses, manage any course
- **Instructor**: Create/edit own courses, view enrollments
- **User**: View published courses, enroll, access purchased content

**Implementation:**
- Use existing `requireRole` middleware
- Add course ownership checks
- Implement enrollment verification

## 🧪 Testing Strategy

**Test Cases:**
- Course creation with multi-language content
- Course search and filtering
- Lesson progress tracking
- Live stream access control
- Chat functionality
- Multi-language switching
- Mobile responsiveness

## 🚀 Deployment Considerations

**Environment Variables:**
- Ensure all JaaC (Jitsi as a Component) configuration is set
- Database connection strings
- File upload configurations
- Jitsi domain and credentials for internal hosting

**Performance:**
- Implement caching for course listings
- Lazy load lesson content
- Optimize images and videos

## 📈 Success Metrics

**Completion Criteria:**
- [ ] All course CRUD operations working
- [ ] Multi-language content fully supported
- [ ] Video player with progress tracking
- [ ] Jitsi live streaming functional
- [ ] Live chat with persistence
- [ ] Progress tracking accurate
- [ ] Mobile responsive design
- [ ] All role permissions enforced

## 🔄 Next Steps

After Phase 2 completion:
- Phase 3: Payment System
- Phase 4: Notifications
- Phase 5: Live Streaming (enhanced)
- Phase 6: CMS & Content
- Phase 7: Advanced Features

---

**Ready to implement?** This plan provides a comprehensive roadmap for Phase 2. Each day includes specific tasks with clear deliverables. The implementation builds on existing code while filling gaps identified in the strategy document.

**Start with Day 1: Enhanced Course Models** to establish the foundation for all subsequent features.
