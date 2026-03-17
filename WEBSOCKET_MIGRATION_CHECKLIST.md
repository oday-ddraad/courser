# WebSocket Migration Implementation Checklist

This checklist provides a step-by-step guide for implementing the WebSocket + Event-Driven notification system.

## Pre-Implementation

### Setup & Dependencies
- [ ] Install Socket.io packages
  ```bash
  npm install socket.io socket.io-client
  npm install -D @types/socket.io
  ```

- [ ] Update environment variables
  ```bash
  # .env.local
  NEXT_PUBLIC_APP_URL=http://localhost:3000
  MONGODB_CHANGE_STREAMS_ENABLED=false
  WEBSOCKET_ENABLED=true
  ```

- [ ] Verify MongoDB connection supports change streams (optional)
  - [ ] MongoDB replica set configured
  - [ ] Change streams enabled

---

## Phase 1: WebSocket Infrastructure

### 1.1 Server-Side WebSocket
- [ ] Create `lib/websocket/server.ts`
  - [ ] WebSocketServer class
  - [ ] User socket mapping
  - [ ] Authentication handling
  - [ ] Room management (per-user rooms)

- [ ] Create `server.ts` for development server
  - [ ] Custom HTTP server
  - [ ] WebSocket integration
  - [ ] Next.js request handler

### 1.2 Client-Side WebSocket
- [ ] Create `hooks/useWebSocket.ts`
  - [ ] Socket connection management
  - [ ] Authentication on connect
  - [ ] Event listeners
  - [ ] Reconnection logic

- [ ] Create `hooks/useRealtimeNotifications.ts`
  - [ ] WebSocket event handlers
  - [ ] React state integration
  - [ ] Browser notification support
  - [ ] SSE fallback for serverless

### 1.3 Testing
- [ ] Test WebSocket connection
- [ ] Test authentication flow
- [ ] Test reconnection
- [ ] Test multiple tabs

---

## Phase 2: Event Bus

### 2.1 Core Event System
- [ ] Create `lib/events/eventBus.ts`
  - [ ] EventBus class
  - [ ] Event registration (on)
  - [ ] Event emission (emit)
  - [ ] Unsubscribe functionality

### 2.2 Notification Events
- [ ] Create `lib/events/notificationEvents.ts`
  - [ ] Event type constants
  - [ ] Event handlers setup
  - [ ] emitLiveLessonStarted()
  - [ ] emitCourseApproved()
  - [ ] emitStudentEnrolled()
  - [ ] emitScheduledReminderDue()

### 2.3 WebSocket Integration
- [ ] Integrate wsServer.sendToUser() in event handlers
- [ ] Add broadcast capability for mass notifications
- [ ] Handle offline users (queue notifications)

### 2.4 Testing
- [ ] Test event registration
- [ ] Test event emission
- [ ] Test handler execution
- [ ] Test error handling

---

## Phase 3: Scheduler System

### 3.1 Time-Based Scheduler
- [ ] Create `lib/scheduler/timeScheduler.ts`
  - [ ] 30-second interval check
  - [ ] Find due notifications
  - [ ] Emit events for processing
  - [ ] Batch processing (100 at a time)

### 3.2 Change Stream Scheduler (Optional)
- [ ] Create `lib/scheduler/changeStreamScheduler.ts`
  - [ ] MongoDB watch pipeline
  - [ ] Real-time change detection
  - [ ] Fallback to polling on error

### 3.3 Testing
- [ ] Test scheduler accuracy
- [ ] Test batch processing
- [ ] Test error recovery
- [ ] Test performance under load

---

## Phase 4: API Integration

### 4.1 Update API Routes

- [ ] `app/api/courses/[id]/lessons/[lessonId]/start-live/route.ts`
  - [ ] Import emitLiveLessonStarted
  - [ ] Call after updating lesson status
  - [ ] Pass required data

- [ ] `app/api/courses/approval/route.ts`
  - [ ] Import emitCourseApproved
  - [ ] Call after course approval
  - [ ] Handle multiple instructors

- [ ] `app/api/enrollments/route.ts`
  - [ ] Import emitStudentEnrolled
  - [ ] Call after enrollment
  - [ ] Handle instructor notification

- [ ] `app/api/courses/[id]/lessons/route.ts`
  - [ ] Import notificationWorker.scheduleNotification
  - [ ] Schedule reminders when lesson created
  - [ ] Handle all enrolled students

### 4.2 Testing
- [ ] Test each API route
- [ ] Verify events are emitted
- [ ] Verify notifications created
- [ ] Verify WebSocket delivery

---

## Phase 5: Server Initialization

### 5.1 Server Setup
- [ ] Create `lib/server/init.ts`
  - [ ] initializeServer() function
  - [ ] Event handler setup
  - [ ] Scheduler startup
  - [ ] Shutdown handling

- [ ] Update `app/api/init/route.ts`
  - [ ] Call initializeServer()
  - [ ] Health check endpoint

### 5.2 Configuration
- [ ] Add to `next.config.ts` or custom server
- [ ] Environment-based feature flags
- [ ] Graceful degradation

### 5.3 Testing
- [ ] Test server initialization
- [ ] Test scheduler startup
- [ ] Test event handler registration

---

## Phase 6: Frontend Integration

### 6.1 Update Components
- [ ] `components/notifications/NotificationBell.tsx`
  - [ ] Add useRealtimeNotifications hook
  - [ ] Handle real-time updates
  - [ ] WebSocket connection status indicator

- [ ] `components/notifications/NotificationsList.tsx`
  - [ ] Real-time list updates
  - [ ] Optimistic UI updates
  - [ ] Reconnection handling

### 6.2 Update Hooks
- [ ] `hooks/useNotifications.ts`
  - [ ] Integrate with WebSocket state
  - [ ] Handle real-time updates
  - [ ] Maintain backward compatibility

### 6.3 Testing
- [ ] Test UI updates on new notification
- [ ] Test mark as read real-time sync
- [ ] Test multiple browser tabs
- [ ] Test offline/online transitions

---

## Phase 7: Cleanup & Migration

### 7.1 Deprecate Old System
- [ ] Update `vercel.json`
  - [ ] Change cron schedule from `0 0 * * *` to `*/5 * * * *`
  - [ ] Update endpoint if needed

- [ ] Disable/Remove `.github/workflows/cron-notifications.yml`
  - [ ] Comment out workflow
  - [ ] Or delete file entirely

- [ ] Update `app/api/cron/notifications/route.ts`
  - [ ] Add deprecation warning
  - [ ] Return 410 Gone status
  - [ ] Or redirect to new endpoint

### 7.2 Migration Script
- [ ] Create `scripts/migrate-notifications.ts`
  - [ ] Verify database indexes
  - [ ] Count pending notifications
  - [ ] Ensure data integrity

- [ ] Run migration
  ```bash
  npx ts-node scripts/migrate-notifications.ts
  ```

### 7.3 Documentation
- [ ] Update API documentation
- [ ] Update architecture diagrams
- [ ] Update deployment guides
- [ ] Create troubleshooting guide

---

## Phase 8: Production Deployment

### 8.1 Pre-Deployment
- [ ] Run all tests
  ```bash
  npm run test
  npm run test:e2e
  ```

- [ ] Performance testing
  - [ ] Load test WebSocket connections
  - [ ] Stress test notification delivery
  - [ ] Database query optimization

- [ ] Security audit
  - [ ] WebSocket authentication
  - [ ] Event validation
  - [ ] Input sanitization

### 8.2 Deployment Strategy
- [ ] Deploy to staging first
  - [ ] Monitor for 24 hours
  - [ ] Verify all notifications working
  - [ ] Check error logs

- [ ] Production deployment
  - [ ] Deploy during low traffic
  - [ ] Monitor WebSocket connections
  - [ ] Watch error rates

### 8.3 Post-Deployment
- [ ] Monitor metrics
  - [ ] WebSocket connection count
  - [ ] Notification delivery rate
  - [ ] Database performance
  - [ ] Error rates

- [ ] Gather feedback
  - [ ] User experience
  - [ ] Performance improvements
  - [ ] Any issues

---

## Testing Checklist

### Unit Tests
- [ ] Event bus functionality
- [ ] WebSocket server methods
- [ ] Scheduler logic
- [ ] Event handlers

### Integration Tests
- [ ] API route + event emission
- [ ] Event handler + notification creation
- [ ] WebSocket + client receipt

### E2E Tests
- [ ] Complete notification flow
- [ ] Real-time updates
- [ ] Multiple concurrent users
- [ ] Offline/online transitions

### Load Tests
- [ ] 100+ concurrent connections
- [ ] 1000+ notifications per minute
- [ ] Database connection pool
- [ ] Memory usage

---

## Files to Create/Modify

### New Files
```
lib/
├── events/
│   ├── eventBus.ts
│   └── notificationEvents.ts
├── scheduler/
│   ├── timeScheduler.ts
│   └── changeStreamScheduler.ts
├── server/
│   └── init.ts
├── websocket/
│   ├── server.ts
│   └── fallback.ts
hooks/
├── useWebSocket.ts
└── useRealtimeNotifications.ts
```

### Modified Files
```
app/
├── api/
│   ├── courses/[id]/lessons/route.ts
│   ├── courses/[id]/lessons/[lessonId]/start-live/route.ts
│   ├── courses/approval/route.ts
│   ├── enrollments/route.ts
│   └── init/route.ts
components/
└── notifications/
    ├── NotificationBell.tsx
    └── NotificationsList.tsx
```

### Deprecated Files
```
.github/workflows/cron-notifications.yml
app/api/cron/notifications/route.ts
```

---

## Success Metrics

### Performance
- [ ] Notification delivery < 1 second
- [ ] WebSocket latency < 100ms
- [ ] Database query time < 50ms
- [ ] 99.9% uptime

### Reliability
- [ ] Zero notification loss
- [ ] Automatic reconnection works
- [ ] Graceful degradation
- [ ] Error recovery

### User Experience
- [ ] Real-time updates visible
- [ ] No duplicate notifications
- [ ] No missed notifications
- [ ] Smooth UI transitions

---

## Rollback Criteria

Immediate rollback if:
- [ ] Notification delivery rate < 95%
- [ ] WebSocket connection errors > 5%
- [ ] Database errors increasing
- [ ] User complaints about missing notifications

Rollback steps:
1. Re-enable old cron job
2. Disable WebSocket features
3. Revert API routes
4. Investigate and fix

---

## Notes

- Keep old system running in parallel during initial deployment
- Monitor for 1 week before full deprecation
- Use feature flags for gradual rollout
- Document all changes in CHANGELOG.md
