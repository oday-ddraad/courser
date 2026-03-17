# WebSocket + Event-Driven Notification System Migration Plan

## Executive Summary

This plan provides a complete roadmap for migrating from the current cron-based notification system to a modern WebSocket + Event-Driven architecture. The migration will be executed in phases to ensure zero downtime and maintain backward compatibility.

---

## Current State Analysis

### Existing Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                  CURRENT CRON-BASED SYSTEM                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  GitHub Actions ──▶ Cron Job (1 min) ──▶ Poll Database     │
│       │                                              │      │
│       ▼                                              ▼      │
│  Heavy Resource Usage                      Check All Courses │
│  Complex Setup                             Create Notifications│
│  Up to 1 min delay                         (30/15/5 min)    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Partial Event-Driven Implementation (Already Exists)
- ✅ `notificationWorker.ts` - Worker for scheduled notifications
- ✅ `ScheduledNotification.ts` - Model for pending reminders
- ✅ `process-scheduled/route.ts` - API endpoint for cron
- ✅ Instant notifications for live lesson start, course approval, enrollment

### Files to Analyze
- `app/api/cron/notifications/route.ts` - Heavy cron job (to be deprecated)
- `app/api/notifications/process-scheduled/route.ts` - Lightweight processor (keep)
- `lib/services/notificationWorker.ts` - Worker (enhance)
- `vercel.json` - Cron configuration (update)

---

## Target Architecture: WebSocket + Event-Driven

### System Overview
```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  WebSocket  │  │  Notification│  │   React     │             │
│  │  Connection │  │    Bell     │  │   Hooks     │             │
│  │   (Real-time)│  │  (UI Update) │  │ (useRealtime)│            │
│  └──────┬──────┘  └─────────────┘  └─────────────┘             │
└─────────┼─────────────────────────────────────────────────────────┘
          │ WebSocket Protocol
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SERVER LAYER                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  WebSocket  │  │   Event     │  │   HTTP API  │             │
│  │   Server    │  │   Emitter   │  │   Routes    │             │
│  │  (Socket.io)│  │  (EventBus) │  │  (RESTful)  │             │
│  └──────┬──────┘  └──────┬──────┘  └─────────────┘             │
│         │                │                                       │
│         └────────────────┘                                       │
│                    │                                             │
│                    ▼                                             │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              EVENT HANDLERS                                  ││
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           ││
│  │  │ LessonStart │ │   Course    │ │  Enrollment │           ││
│  │  │   Handler   │ │   Approval  │ │   Handler   │           ││
│  │  └─────────────┘ └─────────────┘ └─────────────┘           ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DATA LAYER                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ Notification│  │  Scheduled  │  │    User     │             │
│  │  Collection │  │ Notification│  │  Collection │             │
│  │  (MongoDB)  │  │  Collection │  │  (MongoDB)  │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: WebSocket Infrastructure (Week 1)

**1.1 Install Dependencies**
```bash
npm install socket.io socket.io-client
npm install -D @types/socket.io
```

**1.2 Create WebSocket Server**
```typescript
// lib/websocket/server.ts
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

export class WebSocketServer {
  private io: SocketIOServer | null = null;
  private userSockets: Map<string, string[]> = new Map();

  initialize(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('authenticate', (userId: string) => {
        this.addUserSocket(userId, socket.id);
        socket.join(`user:${userId}`);
      });

      socket.on('disconnect', () => {
        this.removeSocket(socket.id);
      });
    });
  }

  private addUserSocket(userId: string, socketId: string) {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, []);
    }
    this.userSockets.get(userId)?.push(socketId);
  }

  private removeSocket(socketId: string) {
    for (const [userId, sockets] of this.userSockets.entries()) {
      const index = sockets.indexOf(socketId);
      if (index > -1) {
        sockets.splice(index, 1);
        if (sockets.length === 0) {
          this.userSockets.delete(userId);
        }
        break;
      }
    }
  }

  sendToUser(userId: string, event: string, data: any) {
    if (!this.io) return;
    this.io.to(`user:${userId}`).emit(event, data);
  }

  sendToUsers(userIds: string[], event: string, data: any) {
    if (!this.io) return;
    userIds.forEach(userId => {
      this.io?.to(`user:${userId}`).emit(event, data);
    });
  }

  broadcast(event: string, data: any) {
    if (!this.io) return;
    this.io.emit(event, data);
  }

  getConnectedUsersCount(): number {
    return this.userSockets.size;
  }

  getIO(): SocketIOServer | null {
    return this.io;
  }
}

export const wsServer = new WebSocketServer();
```

**1.3 Create WebSocket Client Hook**
```typescript
// hooks/useWebSocket.ts
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { io, Socket } from 'socket.io-client';

interface WebSocketState {
  isConnected: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export function useWebSocket() {
  const { data: session } = useSession();
  const socketRef = useRef<Socket | null>(null);
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isAuthenticated: false,
    error: null,
  });

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const socket = io(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', {
      transports: ['websocket'],
      autoConnect: true,
    });

    socket.on('connect', () => {
      setState(prev => ({ ...prev, isConnected: true, error: null }));
      
      if (session?.user?.id) {
        socket.emit('authenticate', session.user.id);
      }
    });

    socket.on('authenticated', () => {
      setState(prev => ({ ...prev, isAuthenticated: true }));
    });

    socket.on('disconnect', () => {
      setState(prev => ({ ...prev, isConnected: false, isAuthenticated: false }));
    });

    socket.on('error', (error) => {
      setState(prev => ({ ...prev, error: error.message }));
    });

    socketRef.current = socket;
  }, [session]);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
  }, []);

  const on = useCallback((event: string, callback: (data: any) => void) => {
    socketRef.current?.on(event, callback);
    return () => socketRef.current?.off(event, callback);
  }, []);

  const emit = useCallback((event: string, data: any) => {
    socketRef.current?.emit(event, data);
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  useEffect(() => {
    if (state.isConnected && session?.user?.id && !state.isAuthenticated) {
      socketRef.current?.emit('authenticate', session.user.id);
    }
  }, [session, state.isConnected, state.isAuthenticated]);

  return {
    socket: socketRef.current,
    ...state,
    on,
    emit,
    connect,
    disconnect,
  };
}
```

---

### Phase 2: Event Bus Implementation (Week 1-2)

**2.1 Create Event Bus**
```typescript
// lib/events/eventBus.ts
type EventHandler = (data: any) => void | Promise<void>;

class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();

  on(event: string, handler: EventHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)!.push(handler);

    return () => {
      const handlers = this.handlers.get(event);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  emit(event: string, data: any): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          const result = handler(data);
          if (result instanceof Promise) {
            result.catch(err => console.error(`Error in event handler for ${event}:`, err));
          }
        } catch (err) {
          console.error(`Error in event handler for ${event}:`, err);
        }
      });
    }
  }

  once(event: string, handler: EventHandler): void {
    const unsubscribe = this.on(event, (data) => {
      unsubscribe();
      handler(data);
    });
  }
}

export const eventBus = new EventBus();
export default eventBus;
```

**2.2 Create Notification Events**
```typescript
// lib/events/notificationEvents.ts
import { eventBus } from './eventBus';
import { notificationService } from '@/lib/services/notifications';
import { wsServer } from '@/lib/websocket/server';
import { ScheduledNotification } from '@/lib/mongodb/models';

export const NOTIFICATION_EVENTS = {
  LIVE_LESSON_STARTED: 'notification:live_lesson_started',
  COURSE_APPROVED: 'notification:course_approved',
  COURSE_REJECTED: 'notification:course_rejected',
  STUDENT_ENROLLED: 'notification:student_enrolled',
  LESSON_PUBLISHED: 'notification:lesson_published',
  SCHEDULED_REMINDER_DUE: 'notification:scheduled_reminder_due',
  NOTIFICATION_CREATED: 'notification:created',
  NOTIFICATION_READ: 'notification:read',
  NOTIFICATION_DELETED: 'notification:deleted',
} as const;

export function setupNotificationEvents() {
  // Live lesson started - notify all enrolled students
  eventBus.on(NOTIFICATION_EVENTS.LIVE_LESSON_STARTED, async (data) => {
    const { courseId, lessonId, lessonTitle, courseTitle, enrolledStudentIds, jitsiRoomName } = data;
    
    for (const userId of enrolledStudentIds) {
      try {
        const notification = await notificationService.createNotification({
          userId,
          type: 'live_lesson_started',
          title: 'Live Lesson Started!',
          message: `"${lessonTitle}" is now live. Click to join!`,
          actionUrl: `/courses/${courseId}/lessons/${lessonId}`,
          data: { courseId, lessonId, jitsiRoomName },
        });
        
        wsServer.sendToUser(userId, NOTIFICATION_EVENTS.NOTIFICATION_CREATED, {
          notification,
        });
      } catch (error) {
        console.error(`Failed to notify user ${userId}:`, error);
      }
    }
  });

  // Course approved - notify instructor
  eventBus.on(NOTIFICATION_EVENTS.COURSE_APPROVED, async (data) => {
    const { courseId, instructorId, courseTitle, courseSlug } = data;
    
    try {
      const notification = await notificationService.createNotification({
        userId: instructorId,
        type: 'course_approved',
        title: 'Course Approved!',
        message: `Your course "${courseTitle}" has been approved and is now live.`,
        actionUrl: `/dashboard/instructor/courses/${courseSlug}`,
        data: { courseId },
      });
      
      wsServer.sendToUser(instructorId, NOTIFICATION_EVENTS.NOTIFICATION_CREATED, {
        notification,
      });
    } catch (error) {
      console.error('Failed to notify instructor:', error);
    }
  });

  // Student enrolled - notify instructor
  eventBus.on(NOTIFICATION_EVENTS.STUDENT_ENROLLED, async (data) => {
    const { courseId, instructorId, studentName, courseTitle, courseSlug } = data;
    
    try {
      const notification = await notificationService.createNotification({
        userId: instructorId,
        type: 'course_enrolled',
        title: 'New Student Enrolled',
        message: `${studentName} has enrolled in your course "${courseTitle}"`,
        actionUrl: `/dashboard/instructor/courses/${courseSlug}/students`,
        data: { courseId },
      });
      
      wsServer.sendToUser(instructorId, NOTIFICATION_EVENTS.NOTIFICATION_CREATED, {
        notification,
      });
    } catch (error) {
      console.error('Failed to notify instructor:', error);
    }
  });

  // Scheduled reminder due - process it
  eventBus.on(NOTIFICATION_EVENTS.SCHEDULED_REMINDER_DUE, async (data) => {
    const { scheduledNotificationId } = data;
    
    try {
      const scheduled = await ScheduledNotification.findById(scheduledNotificationId);
      if (!scheduled || scheduled.status !== 'pending') return;
      
      const notification = await notificationService.createNotification({
        userId: scheduled.userId.toString(),
        type: scheduled.type as any,
        title: Object.values(scheduled.title)[0],
        message: Object.values(scheduled.message)[0],
        actionUrl: scheduled.actionUrl,
        data: scheduled.data,
      });
      
      scheduled.status = 'sent';
      scheduled.sentAt = new Date();
      await scheduled.save();
      
      wsServer.sendToUser(scheduled.userId.toString(), NOTIFICATION_EVENTS.NOTIFICATION_CREATED, {
        notification,
      });
    } catch (error) {
      console.error('Failed to process scheduled notification:', error);
    }
  });
}

// Helper functions to emit events
export function emitLiveLessonStarted(data: {
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  courseTitle: string;
  enrolledStudentIds: string[];
  jitsiRoomName: string;
}) {
  eventBus.emit(NOTIFICATION_EVENTS.LIVE_LESSON_STARTED, data);
}

export function emitCourseApproved(data: {
  courseId: string;
  instructorId: string;
  courseTitle: string;
  courseSlug: string;
}) {
  eventBus.emit(NOTIFICATION_EVENTS.COURSE_APPROVED, data);
}

export function emitStudentEnrolled(data: {
  courseId: string;
  instructorId: string;
  studentName: string;
  courseTitle: string;
  courseSlug: string;
}) {
  eventBus.emit(NOTIFICATION_EVENTS.STUDENT_ENROLLED, data);
}

export function emitScheduledReminderDue(scheduledNotificationId: string) {
  eventBus.emit(NOTIFICATION_EVENTS.SCHEDULED_REMINDER_DUE, { scheduledNotificationId });
}
```

---

### Phase 3: Scheduled Notification System (Cron Replacement)

**3.1 Create Time-Based Event Scheduler**
```typescript
// lib/scheduler/timeScheduler.ts
import { eventBus } from '@/lib/events/eventBus';
import { ScheduledNotification } from '@/lib/mongodb/models';
import { emitScheduledReminderDue } from '@/lib/events/notificationEvents';

class TimeScheduler {
  private checkInterval: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL_MS = 30000; // Check every 30 seconds

  start() {
    console.log('Starting Time Scheduler...');
    this.checkInterval = setInterval(() => this.checkDueNotifications(), this.CHECK_INTERVAL_MS);
    this.checkDueNotifications();
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private async checkDueNotifications() {
    try {
      const now = new Date();
      
      const dueNotifications = await ScheduledNotification.find({
        status: 'pending',
        sendAt: { $lte: now },
      })
        .sort({ sendAt: 1 })
        .limit(100)
        .lean();

      for (const notification of dueNotifications) {
        emitScheduledReminderDue(notification._id.toString());
      }

      if (dueNotifications.length > 0) {
        console.log(`Processed ${dueNotifications.length} scheduled notifications`);
      }
    } catch (error) {
      console.error('Error checking due notifications:', error);
    }
  }
}

export const timeScheduler = new TimeScheduler();
```

---

### Phase 4: API Route Integration

**4.1 Update Start Live Route**
```typescript
// app/api/courses/[id]/lessons/[lessonId]/start-live/route.ts
import { emitLiveLessonStarted } from '@/lib/events/notificationEvents';

// After updating lesson status
emitLiveLessonStarted({
  courseId: course._id.toString(),
  lessonId: lesson._id.toString(),
  lessonTitle: lesson.title.en,
  courseTitle: course.title.en,
  enrolledStudentIds,
  jitsiRoomName: lesson.jitsiRoomName,
});
```

**4.2 Update Course Approval Route**
```typescript
// app/api/courses/approval/route.ts
import { emitCourseApproved } from '@/lib/events/notificationEvents';

// After approving course
emitCourseApproved({
  courseId: course._id.toString(),
  instructorId: course.instructorIds[0].toString(),
  courseTitle: course.title.en,
  courseSlug: course.slug,
});
```

**4.3 Update Enrollment Route**
```typescript
// app/api/enrollments/route.ts
import { emitStudentEnrolled } from '@/lib/events/notificationEvents';

// After successful enrollment
emitStudentEnrolled({
  courseId: course._id.toString(),
  instructorId: course.instructorIds[0].toString(),
  studentName: user.name,
  courseTitle: course.title.en,
  courseSlug: course.slug,
});
```

---

### Phase 5: Server Startup & Initialization

**5.1 Create Server Initialization**
```typescript
// lib/server/init.ts
import { timeScheduler } from '@/lib/scheduler/timeScheduler';
import { changeStreamScheduler } from '@/lib/scheduler/changeStreamScheduler';
import { setupNotificationEvents } from '@/lib/events/notificationEvents';

let initialized = false;

export async function initializeServer() {
  if (initialized) return;
  
  console.log('Initializing server...');
  
  // Setup event handlers
  setupNotificationEvents();
  
  // Start scheduler (prefer change streams, fallback to polling)
  if (process.env.MONGODB_CHANGE_STREAMS_ENABLED === 'true') {
    await changeStreamScheduler.start();
  } else {
    timeScheduler.start();
  }
  
  initialized = true;
  console.log('Server initialization complete');
}

export function shutdownServer() {
  console.log('Shutting down server...');
  timeScheduler.stop();
  changeStreamScheduler.stop();
  initialized = false;
}
```

**5.2 Update API Initialization Route**
```typescript
// app/api/init/route.ts
import { NextResponse } from 'next/server';
import { initializeServer } from '@/lib/server/init';

export async function GET() {
  try {
    await initializeServer();
    
    return NextResponse.json({
      success: true,
      message: 'Server initialized successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Initialization error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to initialize server' },
      { status: 500 }
    );
  }
}
```

---

### Phase 6: WebSocket Server Integration

**6.1 Update Next.js Server for WebSocket**
```typescript
// server.ts (for development)
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { wsServer } from './lib/websocket/server';
import { initializeServer } from './lib/server/init';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  // Initialize WebSocket server
  wsServer.initialize(server);
  
  // Initialize server services
  initializeServer();

  server.listen(3000, () => {
    console.log('> Ready on http://localhost:3000');
  });
});
```

**6.2 Production WebSocket Setup (Vercel)**
Since Vercel doesn't support WebSocket in serverless functions, use:
- **Option A**: Deploy to VPS/Dedicated server
- **Option B**: Use external WebSocket service (Pusher, Ably, Socket.io cluster)
- **Option C**: Use Server-Sent Events (SSE) as fallback

```typescript
// lib/websocket/fallback.ts
// For serverless environments (Vercel)

export function useServerSentEvents() {
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && !eventSource) {
      const es = new EventSource('/api/notifications/stream');
      
      es.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('SSE notification:', data);
      };

      setEventSource(es);
    }

    return () => {
      eventSource?.close();
    };
  }, []);

  return eventSource;
}
```

---

### Phase 7: Cleanup & Migration

**7.1 Remove Old Cron Job**
```bash
# Delete old GitHub Actions workflow
rm .github/workflows/cron-notifications.yml

# Update vercel.json to remove old cron
# Keep only the lightweight scheduled notification processor
```

**7.2 Update vercel.json**
```json
{
  "crons": [
    {
      "path": "/api/notifications/process-scheduled",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

**7.3 Migration Script**
```typescript
// scripts/migrate-notifications.ts
import connectDB from '@/lib/mongodb/connection';
import { ScheduledNotification } from '@/lib/mongodb/models';

async function migrate() {
  await connectDB();
  
  const pendingCount = await ScheduledNotification.countDocuments({
    status: 'pending',
  });
  
  console.log(`Found ${pendingCount} pending scheduled notifications`);
  
  await ScheduledNotification.createIndexes();
  
  console.log('Migration complete');
  process.exit(0);
}

migrate().catch(console.error);
```

---

## File Structure

```
lib/
├── events/
│   ├── eventBus.ts              # Central event bus
│   └── notificationEvents.ts    # Notification event handlers
├── scheduler/
│   ├── timeScheduler.ts         # Time-based polling scheduler
│   └── changeStreamScheduler.ts # MongoDB change streams
├── server/
│   └── init.ts                  # Server initialization
├── websocket/
│   ├── server.ts                # WebSocket server
│   └── fallback.ts              # SSE fallback for serverless
hooks/
├── useWebSocket.ts              # WebSocket client hook
└── useRealtimeNotifications.ts  # Real-time notification hook
app/
├── api/
│   ├── init/
│   │   └── route.ts             # Server initialization endpoint
│   └── notifications/
│       └── stream/
│           └── route.ts         # SSE endpoint for serverless
```

---

## Migration Timeline

| Phase | Duration | Tasks |
|-------|----------|-------|
| **Phase 1** | Week 1 | WebSocket infrastructure, server setup |
| **Phase 2** | Week 1-2 | Event bus, notification event handlers |
| **Phase 3** | Week 2 | Time scheduler, change streams |
| **Phase 4** | Week 3 | API route integration |
| **Phase 5** | Week 3 | Server initialization |
| **Phase 6** | Week 4 | Testing, optimization |
| **Phase 7** | Week 4 | Cleanup, remove old cron |

---

## Testing Strategy

### Unit Tests
```typescript
// __tests__/events/notificationEvents.test.ts
import { setupNotificationEvents } from '@/lib/events/notificationEvents';
import { eventBus } from '@/lib/events/eventBus';

describe('Notification Events', () => {
  beforeEach(() => {
    setupNotificationEvents();
  });

  it('should handle live lesson started event', async () => {
    const mockData = {
      courseId: 'course123',
      lessonId: 'lesson456',
      lessonTitle: 'Test Lesson',
      courseTitle: 'Test Course',
      enrolledStudentIds: ['user1', 'user2'],
      jitsiRoomName: 'room123',
    };

    // Emit event and verify handlers are called
    eventBus.emit('notification:live_lesson_started', mockData);
    
    // Assertions...
  });
});
```

### Integration Tests
```typescript
// __tests__/integration/notifications.test.ts
import { createMocks } from 'node-mocks-http';
import { POST as startLive } from '@/app/api/courses/[id]/lessons/[lessonId]/start-live/route';

describe('Notification Integration', () => {
  it('should create notifications when live lesson starts', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      url: '/api/courses/course123/lessons/lesson456/start-live',
    });

    await startLive(req as any, { params: Promise.resolve({ id: 'course123', lessonId: 'lesson456' }) });

    // Verify notifications were created
    // Verify WebSocket events were emitted
  });
});
```

### E2E Tests
```typescript
// cypress/e2e/notifications.cy.ts
describe('Real-time Notifications', () => {
  beforeEach(() => {
    cy.login('instructor@example.com', 'password');
  });

  it('should receive real-time notification when student enrolls', () => {
    // Start WebSocket connection
    cy.window().then((win) => {
      cy.stub(win, 'WebSocket').as('websocket');
    });

    // Have student enroll
    cy.request('POST', '/api/enrollments', {
      courseId: 'course123',
    });

    // Verify notification appears in real-time
    cy.get('[data-testid="notification-bell"]').should('have.attr', 'data-count', '1');
    cy.get('[data-testid="notification-dropdown"]').should('contain', 'New Student Enrolled');
  });
});
```

---

## Performance Considerations

### WebSocket Optimization
- **Connection Pooling**: Reuse connections across tabs
- **Heartbeat**: Keep connections alive
- **Reconnection**: Exponential backoff strategy
- **Message Batching**: Batch multiple notifications

### Database Optimization
- **Indexes**: Ensure proper indexes on `userId`, `status`, `sendAt`
- **Change Streams**: Use for real-time updates instead of polling
- **Connection Pooling**: Reuse MongoDB connections

### Scalability
- **Horizontal Scaling**: Use Redis adapter for Socket.io
- **Load Balancing**: Sticky sessions for WebSocket
- **Microservices**: Separate notification service if needed

---

## Security Considerations

### Authentication
- Authenticate WebSocket connections with JWT
- Validate user permissions before sending notifications
- Use secure cookies for session management

### Data Protection
- Encrypt sensitive notification data
- Sanitize user input to prevent XSS
- Rate limit notification creation

### Access Control
- Users can only receive their own notifications
- Instructors can send to enrolled students only
- Admins have broader access

---

## Monitoring & Logging

### Metrics to Track
- WebSocket connection count
- Notification delivery rate
- Event processing time
- Database query performance
- Error rates

### Logging
```typescript
// lib/logger/notificationLogger.ts
import { createLogger, format, transports } from 'winston';

export const notificationLogger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.File({ filename: 'logs/notifications-error.log', level: 'error' }),
    new transports.File({ filename: 'logs/notifications.log' }),
    new transports.Console(),
  ],
});

// Usage
notificationLogger.info('Notification created', { userId, type, notificationId });
notificationLogger.error('Failed to send notification', { error, userId });
```

---

## Rollback Plan

If issues occur during migration:

1. **Immediate Rollback**:
   - Re-enable old cron job
   - Disable WebSocket server
   - Revert to polling-based notifications

2. **Data Consistency**:
   - Ensure no notifications are lost during rollback
   - Verify scheduled notifications are still processed

3. **Communication**:
   - Notify users of temporary issues
   - Provide status updates

---

## Success Criteria

- [ ] WebSocket connections established successfully
- [ ] Real-time notifications delivered within 1 second
- [ ] All notification types working (instant + scheduled)
- [ ] Zero data loss during migration
- [ ] Performance improved (reduced database load)
- [ ] Old cron job removed
- [ ] Comprehensive test coverage
- [ ] Documentation updated

---

## Conclusion

This migration plan provides a complete roadmap for transitioning from a cron-based notification system to a modern WebSocket + Event-Driven architecture. The phased approach ensures minimal risk while delivering significant improvements in real-time capabilities, performance, and reliability.

The new system will provide:
- **Instant delivery** of notifications
- **Real-time updates** via WebSocket
- **Better scalability** with event-driven architecture
- **Reduced complexity** by removing heavy cron dependencies
- **Improved user experience** with immediate feedback
