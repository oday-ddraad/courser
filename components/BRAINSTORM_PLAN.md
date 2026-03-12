# Comprehensive Implementation Plan

## Based on myplan.md Requirements:

### 1. Meeting Lifecycle Management (Steps 1-5 from myplan.md)
**Current State:** Partially implemented
**Missing:**
- Store JWT token in Meeting model when instructor starts
- Reuse existing meeting on page reload instead of creating new
- Delete meeting data when lesson ends
- Handle reconnection scenarios

**Implementation:**
1. Modify `start-live/route.ts` to create/update Meeting document with JWT token
2. Modify `jaas/meetings/route.ts` to check for existing active meeting before creating new
3. Ensure `end-live/route.ts` properly deletes meeting data
4. Add meeting data to live-status response

### 2. Student Real-time Updates (Step 4 from myplan.md)
**Current State:** Basic polling exists in LiveLessonPlayer
**Missing:**
- Proper state transitions: scheduled → waiting → live → ended
- Clear "Meeting Ended" message
- Auto-refresh when meeting starts

**Implementation:**
1. Enhance `live-status/route.ts` to return meeting data
2. Update `LiveLessonPlayer.tsx` with better state management
3. Add "Meeting Ended" UI state

### 3. Notification System (Step 5 from myplan.md)
**Current State:** Only "live started" notification exists
**Missing:**
- Scheduled notification
- 15min reminder for students
- 15min reminder for instructor
- Live ended notification
- Click notification navigates to lesson

**Implementation:**
1. Create cron job for scheduled reminders
2. Add notification when lesson is scheduled
3. Add notification when live ends
4. Ensure actionUrl points to correct lesson page

### 4. Bug Fixes (Steps 6-7 from myplan.md)
**Issue 6:** USD pricing shows as free
**Root Cause:** Price display logic probably only checks for SYP
**Fix:** Update price display to handle all currencies

**Issue 7:** Lessons show as preview even if not allowed
**Root Cause:** First lesson auto-set as preview without checking enrollment requirement
**Fix:** Update lesson creation logic to respect isPreview setting

## Files to Modify:

### API Routes:
1. `app/api/courses/[id]/lessons/[lessonId]/start-live/route.ts` - Store meeting with JWT
2. `app/api/courses/[id]/lessons/[lessonId]/end-live/route.ts` - Delete meeting data
3. `app/api/courses/[id]/lessons/[lessonId]/live-status/route.ts` - Return meeting info
4. `app/api/jaas/meetings/route.ts` - Check existing meetings
5. `app/api/cron/notifications/route.ts` - Add reminder notifications

### Components:
1. `components/courses/LiveLessonPlayer.tsx` - Enhanced state management
2. `components/courses/LessonManagement.tsx` - Add "End Live" button
3. `components/courses/CourseCreationWizard.tsx` - Fix preview logic
4. `components/courses/CourseCard.tsx` - Fix price display

### Models:
1. `lib/mongodb/models/Meeting.ts` - May need JWT token field verification

## Implementation Order:
1. Fix Meeting model and start-live API
2. Update jaas/meetings API to reuse meetings
3. Enhance end-live API to delete meeting
4. Update LiveLessonPlayer with better states
5. Add notification cron job
6. Fix pricing bug
7. Fix preview bug
