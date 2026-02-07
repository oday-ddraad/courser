# Complete System Strategy: MongoDB + Auth + Multi-Role Platform

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [Database Schema Design](#database-schema-design)
4. [Authentication & Authorization](#authentication--authorization)
5. [User Roles & Permissions](#user-roles--permissions)
6. [Course Management System](#course-management-system)
7. [Payment System](#payment-system)
8. [Notification System](#notification-system)
9. [Live Streaming Integration](#live-streaming-integration)
10. [Multi-language Support](#multi-language-support)
11. [CMS Features](#cms-features)
12. [Dashboard & Admin Panel](#dashboard--admin-panel)
13. [Service Monitoring & Usage Tracking](#service-monitoring--usage-tracking)
14. [Implementation Phases](#implementation-phases)
15. [File Structure](#file-structure)

---

## 🎯 System Overview

### Core Features
- **Multi-role System**: Admin, Instructor, User
- **Course Management**: Create, edit, publish courses with multi-language support
- **Payment Processing**: Manual receipt verification workflow
- **Live Streaming**: Microsoft Teams integration with notifications
- **Notifications**: Email (Resend) + In-app notifications
- **Multi-language**: Arabic, English, German (RTL support)
- **CMS**: Dynamic landing page content management
- **Dashboard**: Full admin/instructor/user dashboards

---

## 🏗️ Architecture & Tech Stack

### Recommended Stack
```
Frontend:
- Next.js 16 App Router
- TypeScript
- Tailwind CSS
- next-intl (i18n)
- shadcn/ui (UI components)

Backend:
- Next.js API Routes / Server Actions
- MongoDB + Mongoose
- NextAuth.js v5 (Auth.js)
- JWT tokens

Services:
- Resend (Email notifications)
- Microsoft Teams API (Live streaming)
- Cloudinary/Uploadthing (File uploads)
- Stripe/PayPal (Payment gateways - optional future)
```

---

## 📊 Database Schema Design

### 1. User Model
```typescript
{
  _id: ObjectId,
  email: string,                    // Unique, required
  password: string,                 // Hashed with bcrypt
  name: string,
  role: 'admin' | 'instructor' | 'user',
  locale: 'en' | 'de' | 'ar',      // Preferred language
  country: string,                  // ISO 3166-1 alpha-2 country code (e.g., 'US', 'DE', 'SA', 'EG')
  avatar: string,                   // URL
  emailVerified: Date | null,
  isActive: boolean,                // Admin can deactivate
  instructorProfile: {              // Only if role === 'instructor'
    bio: {
      en: string,
      de: string,
      ar: string
    },
    specialization: string[],
    rating: number,
    totalStudents: number,
    totalCourses: number
  },
  notifications: Notification[],    // Embedded
  createdAt: Date,
  updatedAt: Date
}
```

### 2. Course Model
```typescript
{
  _id: ObjectId,
  slug: string,                     // Unique, URL-friendly
  instructorId: ObjectId,           // Reference to User (instructor)
  title: {
    en: string,
    de: string,
    ar: string
  },
  description: {
    en: string,
    de: string,
    ar: string
  },
  content: {                        // Full course description
    en: string,
    de: string,
    ar: string
  },
  thumbnail: string,                // Image URL
  price: number,
  currency: string,                 // 'USD', 'EUR', etc.
  level: 'beginner' | 'intermediate' | 'advanced',
  duration: number,                 // Total hours
  category: string,
  tags: string[],
  lessons: Lesson[],                // Embedded lessons
  materials: Material[],             // PDFs, videos, etc.
  isPublished: boolean,
  isLiveStream: boolean,            // If course uses Teams
  teamsMeetingLink: string,         // Microsoft Teams link
  enrollmentCount: number,
  rating: number,
  reviews: Review[],
  createdAt: Date,
  updatedAt: Date,
  publishedAt: Date | null
}
```

### 3. Lesson Model (Embedded in Course)
```typescript
{
  _id: ObjectId,
  order: number,
  title: {
    en: string,
    de: string,
    ar: string
  },
  description: {
    en: string,
    de: string,
    ar: string
  },
  content: {
    en: string,                     // Rich text/HTML
    de: string,
    ar: string
  },
  videoUrl: string,                 // If pre-recorded
  duration: number,                 // Minutes
  isLiveStream: boolean,
  scheduledDateTime: Date,          // For live streams
  teamsMeetingLink: string,         // Microsoft Teams link
  resources: {
    type: 'pdf' | 'video' | 'link',
    url: string,
    name: string
  }[],
  isPreview: boolean,               // Free preview lesson
  createdAt: Date
}
```

### 4. Material Model (Course Resources)
```typescript
{
  _id: ObjectId,
  courseId: ObjectId,
  name: {
    en: string,
    de: string,
    ar: string
  },
  type: 'pdf' | 'video' | 'document',
  fileUrl: string,
  fileSize: number,
  isAccessibleAfterCourse: boolean, // Instructor controls access
  uploadedBy: ObjectId,            // Instructor ID
  createdAt: Date
}
```

### 5. Enrollment Model
```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  courseId: ObjectId,
  paymentId: ObjectId,              // Reference to Payment
  status: 'pending' | 'active' | 'completed' | 'cancelled',
  progress: {
    completedLessons: ObjectId[],
    lastAccessedLesson: ObjectId,
    lastAccessedAt: Date,
    completionPercentage: number
  },
  enrolledAt: Date,
  completedAt: Date | null
}
```

### 6. Payment Model
```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  courseId: ObjectId,
  amount: number,
  currency: string,
  paymentMethod: 'bank_transfer' | 'credit_card' | 'paypal' | 'momo' | 'vodafone_cash' | 'fawry' | 'other',
  country: string,                 // User's country at time of payment
  receiptImage: string,            // Uploaded receipt URL
  status: 'pending' | 'approved' | 'rejected' | 'cancelled',
  reviewedBy: ObjectId | null,     // Admin or Instructor ID
  reviewedAt: Date | null,
  reviewNotes: string,
  transactionId: string,           // User-provided transaction ID
  createdAt: Date,
  updatedAt: Date
}
```

### 6a. PaymentMethodConfig Model (Country-Specific Payment Methods)
```typescript
{
  _id: ObjectId,
  country: string,                 // ISO 3166-1 alpha-2 country code (e.g., 'SY' for Syria)
  paymentMethods: {
    methodId: string,               // Unique identifier for this payment method
    type: 'bank_transfer' | 'credit_card' | 'paypal' | 'mobile_wallet' | 'crypto' | 'custom',
    name: {                        // Display name in different languages
      en: string,
      de: string,
      ar: string
    },
    thumbnail: string,             // Thumbnail image URL for the payment method
    icon: string,                  // Icon name or URL (fallback)
    instructions: {                // Payment instructions
      en: string,
      de: string,
      ar: string
    },
    // Payment details (varies by type)
    accountDetails: {
      // For bank transfer
      bankName?: string,
      accountNumber?: string,
      iban?: string,
      swiftCode?: string,
      // For mobile wallet
      phoneNumber?: string,
      walletAddress?: string,
      // For crypto
      cryptoAddress?: string,
      cryptoNetwork?: string,      // e.g., 'Bitcoin', 'Ethereum', 'USDT'
      // For custom methods
      customLabel?: string,
      customValue?: string
    },
    qrCode: string,                // QR code image URL (for mobile wallets, crypto, etc.)
    // Amount configuration (optional - if not set, uses course price)
    fixedAmount: number | null,    // Fixed amount (if null, uses course price)
    currency: string,              // Currency for this payment method
    isActive: boolean,
    isCustom: boolean,             // True if admin-created custom method
    order: number,                // Display order
    createdAt: Date,
    updatedAt: Date
  }[],
  defaultCurrency: string,         // Default currency for this country
  createdAt: Date,
  updatedAt: Date
}
```

**Syrian Payment Methods Examples:**
```typescript
// Example for Syria (SY)
{
  country: 'SY',
  paymentMethods: [
    {
      methodId: 'sy-mtcn',
      type: 'mobile_wallet',
      name: { en: 'MTN Cash', ar: 'إم تي إن كاش', de: 'MTN Cash' },
      thumbnail: '/images/payment-methods/mtn-cash.png',
      phoneNumber: '+963912345678',
      qrCode: '/images/qr-codes/mtn-cash.png',
      currency: 'SYP',
      isCustom: false
    },
    {
      methodId: 'sy-syriatel',
      type: 'mobile_wallet',
      name: { en: 'Syriatel Cash', ar: 'سيرياتيل كاش', de: 'Syriatel Cash' },
      thumbnail: '/images/payment-methods/syriatel-cash.png',
      phoneNumber: '+963933456789',
      qrCode: '/images/qr-codes/syriatel-cash.png',
      currency: 'SYP',
      isCustom: false
    },
    {
      methodId: 'sy-bank-transfer',
      type: 'bank_transfer',
      name: { en: 'Bank Transfer', ar: 'تحويل بنكي', de: 'Banküberweisung' },
      thumbnail: '/images/payment-methods/bank-transfer.png',
      bankName: 'Commercial Bank of Syria',
      accountNumber: '1234567890',
      iban: 'SY123456789012345678901234',
      currency: 'SYP',
      isCustom: false
    },
    {
      methodId: 'custom-crypto',
      type: 'crypto',
      name: { en: 'USDT Transfer', ar: 'تحويل USDT', de: 'USDT Überweisung' },
      thumbnail: '/images/payment-methods/usdt.png',
      cryptoAddress: '0x1234567890abcdef...',
      cryptoNetwork: 'USDT (TRC20)',
      qrCode: '/images/qr-codes/usdt.png',
      currency: 'USDT',
      isCustom: true  // Admin-created custom method
    }
  ],
  defaultCurrency: 'SYP'
}
```

### 7. Notification Model
```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  type: 'payment_approved' | 'payment_rejected' | 'course_enrolled' | 
        'live_stream_starting' | 'lesson_available' | 'course_completed' |
        'admin_message' | 'instructor_message',
  title: {
    en: string,
    de: string,
    ar: string
  },
  message: {
    en: string,
    de: string,
    ar: string
  },
  link: string,                    // URL to related page
  isRead: boolean,
  emailSent: boolean,              // If email notification sent
  metadata: {
    courseId: ObjectId,
    paymentId: ObjectId,
    teamsLink: string              // For live stream notifications
  },
  createdAt: Date
}
```

### 8. Article Model (Landing Page CMS)
```typescript
{
  _id: ObjectId,
  slug: string,
  title: {
    en: string,
    de: string,
    ar: string
  },
  content: {
    en: string,
    de: string,
    ar: string
  },
  excerpt: {
    en: string,
    de: string,
    ar: string
  },
  image: string,
  authorId: ObjectId,              // Admin or Instructor
  isPublished: boolean,
  order: number,                   // Display order on landing page
  createdAt: Date,
  updatedAt: Date,
  publishedAt: Date | null
}
```

### 9. SocialLink Model (Landing Page)
```typescript
{
  _id: ObjectId,
  platform: 'facebook' | 'twitter' | 'instagram' | 'youtube' | 'linkedin' | 'custom',
  name: {
    en: string,
    de: string,
    ar: string
  },
  url: string,
  icon: string,                    // Icon name or URL
  order: number,
  isActive: boolean
}
```

### 10. Settings Model (Global Settings)
```typescript
{
  _id: ObjectId,
  key: string,                     // Unique setting key
  value: any,                      // Can be string, number, object, array
  category: 'general' | 'payment' | 'email' | 'teams' | 'ui',
  description: {
    en: string,
    de: string,
    ar: string
  },
  updatedBy: ObjectId,
  updatedAt: Date
}
```

### 11. EmailLog Model (Email Monitoring)
```typescript
{
  _id: ObjectId,
  userId: ObjectId | null,         // Null for system emails
  to: string,                      // Recipient email
  type: NotificationType,          // Type of notification
  subject: string,
  status: 'sent' | 'failed' | 'pending',
  resendId: string | null,        // Resend API response ID
  error: string | null,            // Error message if failed
  metadata: {
    courseId: ObjectId | null,
    paymentId: ObjectId | null,
    locale: string
  },
  createdAt: Date
}
```

### 12. SystemMetrics Model (Service Usage Monitoring)
```typescript
{
  _id: ObjectId,
  date: Date,                      // Date of metrics (YYYY-MM-DD)
  service: 'resend' | 'cloudinary' | 'mongodb' | 'vercel',
  metrics: {
    emailsSent: number,            // For Resend
    emailsFailed: number,
    filesUploaded: number,         // For Cloudinary
    creditsUsed: number,
    storageUsed: number,           // For MongoDB (in MB)
    bandwidthUsed: number,         // For Vercel (in GB)
    functionInvocations: number
  },
  limits: {
    dailyLimit: number,
    monthlyLimit: number,
    currentUsage: number,
    percentageUsed: number
  },
  alerts: {
    threshold: number,             // Alert threshold (e.g., 80%)
    isAlerted: boolean
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 13. ChatMessage Model (Course Chat Messages)
```typescript
{
  _id: ObjectId,
  courseId: ObjectId,
  lessonId: ObjectId | null,      // Null for course-wide chat, ObjectId for lesson-specific
  userId: ObjectId,
  message: string,
  attachments: {
    type: 'image' | 'file' | 'link',
    url: string,
    name: string,
    size: number
  }[],
  isInstructorMessage: boolean,    // True if sent by instructor
  isPinned: boolean,               // Instructor can pin important messages
  editedAt: Date | null,
  deletedAt: Date | null,          // Soft delete
  reactions: {                     // Emoji reactions
    emoji: string,
    userIds: ObjectId[]
  }[],
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔐 Authentication & Authorization

### NextAuth.js v5 Setup

**Configuration:**
```typescript
// auth.config.ts
import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { MongoDBAdapter } from "@auth/mongodb-adapter"

export const authConfig = {
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Verify credentials against MongoDB
        // Return user object with role
      }
    })
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard')
      
      if (isOnDashboard) {
        if (isLoggedIn) return true
        return false // Redirect to login
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role
        session.user.id = token.id
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/login',
    signUp: '/auth/signup'
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60 // 30 days
  }
}
```

### JWT Token Structure
```typescript
{
  id: string,                      // User ID
  email: string,
  role: 'admin' | 'instructor' | 'user',
  iat: number,
  exp: number
}
```

### Password Hashing
- Use `bcryptjs` for password hashing
- Salt rounds: 12
- Never store plain passwords

---

## 👥 User Roles & Permissions

### Admin Permissions
- ✅ Full system access
- ✅ Manage all users (create, edit, delete, activate/deactivate)
- ✅ Approve/reject payments
- ✅ **Manage payment methods** (add, edit, delete, custom methods)
- ✅ Manage all courses
- ✅ Manage articles and social links
- ✅ System settings
- ✅ View all analytics
- ✅ Control instructor permissions

### Instructor Permissions
- ✅ Create/edit own courses
- ✅ Upload course materials (PDFs, videos)
- ✅ Set course prices
- ✅ Schedule live streams (Microsoft Teams)
- ✅ View enrolled students for own courses
- ✅ Approve/reject payments for own courses (if admin allows)
- ✅ Control material access after course completion
- ✅ View course analytics (own courses only)
- ✅ Manage course content in 3 languages

### User Permissions
- ✅ Browse and search courses
- ✅ View course previews
- ✅ Purchase courses
- ✅ Upload payment receipts
- ✅ Access purchased courses
- ✅ View lesson content
- ✅ Download course materials (if allowed)
- ✅ Join live streams
- ✅ View notifications
- ✅ Update profile

### Permission Middleware
```typescript
// lib/auth/permissions.ts
export function requireRole(allowedRoles: Role[]) {
  return async (req: NextRequest) => {
    const session = await auth()
    if (!session?.user || !allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
  }
}
```

---

## 📚 Course Management System

### Course Creation Flow (Instructor)
1. Instructor navigates to `/dashboard/instructor/courses/new`
2. Fill course form with multi-language fields:
   - Title (en, de, ar)
   - Description (en, de, ar)
   - Content (en, de, ar)
   - Price, currency, level, category
   - Upload thumbnail
3. Add lessons:
   - Each lesson has multi-language title/description
   - Upload videos or set as live stream
   - Add resources (PDFs, links)
   - Set preview lessons
4. Upload course materials:
   - PDFs, videos, documents
   - Set access control (available after course completion)
5. Publish course (admin can require approval)

### Course Search & Filter
```typescript
// Search by:
- Course title (multi-language)
- Instructor name
- Category
- Level
- Price range
- Rating
- Language
```

### Course Access Control
- Users can only access purchased courses
- Preview lessons are free
- Materials access controlled by instructor
- Live stream links sent via notification

### Course Page Implementation (`/courses/[slug]/lessons/[lessonId]`)

**Course Page Features:**

1. **Video Player (Pre-recorded Lessons)**
   - HTML5 video player with custom controls
   - Video quality selection (if multiple qualities available)
   - Playback speed control (0.5x, 1x, 1.25x, 1.5x, 2x)
   - Fullscreen support
   - Progress tracking (saves where user left off)
   - Subtitles/captions support (if available)
   - Download option (if instructor allows)

2. **Live Stream Player (Microsoft Teams)**
   - Embedded Teams meeting widget
   - Join button (only for enrolled students)
   - Pre-join screen with meeting details
   - Countdown timer (if stream hasn't started)
   - "Stream Starting Soon" message
   - Auto-join option (if enabled)

3. **Live Chat Integration**
   - **Microsoft Teams Chat**: Native Teams chat within the meeting
   - **In-App Chat** (Alternative): Custom chat widget for course discussions
   - Real-time messaging during live streams
   - Chat history (if Teams API allows)
   - Emoji support
   - File sharing in chat (if Teams allows)

**Implementation:**

```typescript
// components/courses/LessonPlayer.tsx
interface LessonPlayerProps {
  lesson: Lesson;
  course: Course;
  enrollment: Enrollment | null;
}

export function LessonPlayer({ lesson, course, enrollment }: LessonPlayerProps) {
  const isEnrolled = !!enrollment;
  const isLiveStream = lesson.isLiveStream;
  const isStreamActive = new Date(lesson.scheduledDateTime) <= new Date();
  
  if (isLiveStream) {
    return (
      <div className="lesson-player">
        <TeamsLiveStream
          meetingLink={lesson.teamsMeetingLink}
          isEnrolled={isEnrolled}
          scheduledDateTime={lesson.scheduledDateTime}
        />
        <LiveChat 
          lessonId={lesson._id}
          courseId={course._id}
          isEnrolled={isEnrolled}
        />
      </div>
    );
  }
  
  return (
    <div className="lesson-player">
      <VideoPlayer
        videoUrl={lesson.videoUrl}
        lessonId={lesson._id}
        enrollment={enrollment}
      />
      <LessonResources resources={lesson.resources} />
    </div>
  );
}
```

**Microsoft Teams Live Stream Component:**

```typescript
// components/courses/TeamsLiveStream.tsx
import { useEffect, useState } from 'react';

export function TeamsLiveStream({ 
  meetingLink, 
  isEnrolled, 
  scheduledDateTime 
}: Props) {
  const [timeUntilStream, setTimeUntilStream] = useState<string>('');
  const [canJoin, setCanJoin] = useState(false);
  
  useEffect(() => {
    const checkStreamStatus = () => {
      const now = new Date();
      const streamTime = new Date(scheduledDateTime);
      const diff = streamTime.getTime() - now.getTime();
      
      if (diff <= 0) {
        setCanJoin(true);
        setTimeUntilStream('');
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeUntilStream(`${hours}h ${minutes}m`);
      }
    };
    
    checkStreamStatus();
    const interval = setInterval(checkStreamStatus, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [scheduledDateTime]);
  
  if (!isEnrolled) {
    return <div>Please enroll in this course to access live streams</div>;
  }
  
  if (!canJoin) {
    return (
      <div className="stream-countdown">
        <h3>Live Stream Starting Soon</h3>
        <p>Stream starts in: {timeUntilStream}</p>
        <p>You'll be able to join automatically when it starts.</p>
      </div>
    );
  }
  
  return (
    <div className="teams-embed">
      <iframe
        src={meetingLink}
        allow="camera; microphone; fullscreen; speaker; display-capture"
        style={{ width: '100%', height: '600px', border: 'none' }}
      />
    </div>
  );
}
```

**Live Chat Component:**

```typescript
// components/courses/LiveChat.tsx
// Option 1: Use Teams native chat (if available via Teams SDK)
// Option 2: Custom in-app chat using WebSockets or Server-Sent Events

export function LiveChat({ lessonId, courseId, isEnrolled }: Props) {
  // If Teams meeting is active, Teams chat is built-in
  // Otherwise, show custom course chat
  
  return (
    <div className="live-chat">
      <ChatHeader />
      <ChatMessages 
        lessonId={lessonId}
        courseId={courseId}
        isEnrolled={isEnrolled}
      />
      <ChatInput 
        lessonId={lessonId}
        courseId={courseId}
        isEnrolled={isEnrolled}
      />
    </div>
  );
}
```

**Microsoft Teams Chat Integration:**

Microsoft Teams provides native chat within meetings. However, for course-specific discussions:

1. **During Live Stream**: Use Teams built-in chat (automatically available)
2. **After Stream**: Store chat messages via Teams API (if accessible)
3. **Course Discussion**: Implement custom chat for course-wide discussions

**Teams Chat API Limitations:**
- Teams chat messages are accessible via Microsoft Graph API
- Requires appropriate permissions
- May have rate limits
- Best to use Teams native chat during meetings

**Alternative: Custom Course Chat**

If Teams chat API is limited, implement custom chat:
- Real-time messaging using WebSockets (Socket.io) or Server-Sent Events
- Store messages in MongoDB
- Show chat during live streams
- Persist chat history for course discussions

**Chat Features:**
- Real-time messaging
- User avatars
- Timestamps
- Emoji support
- File attachments (if needed)
- Instructor moderation
- Chat history

---

## 💳 Payment System

### Country-Specific Payment Methods

**Payment methods are dynamically shown based on user's country:**

**Example Configurations:**
- **Syria (SY)**: MTN Cash, Syriatel Cash, Bank Transfer, USDT, Custom methods
- **Egypt (EG)**: Bank Transfer, Vodafone Cash, Fawry, MOMO
- **Germany (DE)**: Bank Transfer, Credit Card, PayPal, SEPA
- **Saudi Arabia (SA)**: Bank Transfer, Credit Card, STC Pay, Mada
- **United States (US)**: Credit Card, PayPal, Bank Transfer
- **Default**: Bank Transfer, Credit Card, PayPal, Other

**Implementation Logic:**
```typescript
// When user opens payment page:
1. Get user's country from profile (or detect from IP/locale)
2. Query PaymentMethodConfig for that country
3. Display only active payment methods for that country
4. Show payment method thumbnails, QR codes, and account details
5. Display amount (course price or fixed amount if set)
6. User selects method and uploads receipt
7. Payment request includes country and selected method
```

### Admin Payment Method Management

**Admin Dashboard: `/dashboard/admin/payment-methods`**

**Features:**
- **View all payment methods** by country
- **Add new payment method**:
  - Select country
  - Choose type (Bank Transfer, Mobile Wallet, Crypto, Custom)
  - Upload thumbnail image
  - Upload QR code image (for mobile wallets/crypto)
  - Enter payment details (phone number, wallet address, bank account, etc.)
  - Set multi-language name and instructions
  - Set fixed amount (optional) or use course price
  - Set currency
  - Set display order
- **Edit existing payment method**
- **Delete payment method** (soft delete - set isActive to false)
- **Enable/Disable** payment methods
- **Reorder** payment methods (drag & drop)

**Custom Payment Method Form:**
```typescript
// Admin can create custom payment methods with:
- Name (en, de, ar)
- Type: mobile_wallet, crypto, bank_transfer, custom
- Thumbnail image upload
- QR code image upload (optional but recommended)
- Payment details:
  * Phone number (for mobile wallets)
  * Wallet address (for crypto/mobile wallets)
  * Bank account details (for bank transfer)
  * Custom fields (for other methods)
- Instructions (en, de, ar)
- Fixed amount (optional - if null, uses course price)
- Currency
- Display order
```

**API Routes:**
```
GET    /api/payment-methods              # Get all payment methods (filtered by country)
GET    /api/payment-methods/[id]         # Get single payment method
POST   /api/payment-methods              # Create payment method (admin)
PUT    /api/payment-methods/[id]         # Update payment method (admin)
DELETE /api/payment-methods/[id]         # Delete payment method (admin)
POST   /api/payment-methods/[id]/toggle  # Enable/disable payment method
POST   /api/payment-methods/reorder      # Reorder payment methods

### Payment Page UI Components

**PaymentMethodSelector Component:**
- Displays payment methods as cards with thumbnails
- Shows QR code when method is selected
- Displays phone number/wallet address
- Shows amount to transfer
- Multi-language instructions

**Payment Method Card:**
```typescript
// components/payments/PaymentMethodCard.tsx
interface PaymentMethodCardProps {
  method: PaymentMethod;
  coursePrice: number;
  currency: string;
  locale: 'en' | 'de' | 'ar';
  onSelect: (methodId: string) => void;
}

// Features:
- Thumbnail image
- Method name (localized)
- Amount display (course price or fixed amount)
- QR code preview (on hover or click)
- Select button
```

**Payment Details Modal:**
- Full-screen or modal view when method selected
- Large QR code display
- Copy-to-clipboard for phone/wallet address
- Payment instructions
- Amount confirmation
```

### Payment Flow
1. **User selects course** → `/courses/[slug]`
2. **Clicks "Enroll"** → Redirects to `/payment/[courseId]`
3. **Payment page** (`/payment/[courseId]`):
   - Shows course details and price
   - **Detects user's country** (from profile or IP)
   - **Loads country-specific payment methods** from PaymentMethodConfig
   - Shows payment methods with **thumbnails** and instructions
   - User selects payment method
   - Shows method-specific details:
     * **Phone number** or **wallet address** (for mobile wallets)
     * **QR code** (for easy scanning)
     * **Bank account details** (for bank transfers)
     * **Amount to transfer** (course price or fixed amount)
     * **Payment instructions** in user's language
   - Upload receipt image (required)
   - Enter transaction ID (optional)
   - Submit payment request
4. **Payment status**: `pending`
5. **Admin/Instructor review**:
   - View payment request in dashboard
   - See uploaded receipt
   - See user's country and selected payment method
   - Approve or reject
   - Add review notes
6. **Notification sent** to user (email + in-app)
7. **If approved**:
   - Enrollment created
   - User gains course access
   - Notification sent

### Payment API Routes
```
POST   /api/payments              # Create payment request
GET    /api/payments              # List payments (filtered by role)
GET    /api/payments/[id]         # Get payment details
PUT    /api/payments/[id]/approve # Approve payment
PUT    /api/payments/[id]/reject  # Reject payment
GET    /api/payment-methods       # Get payment methods for country
POST   /api/payment-methods       # Create/update payment method config (admin)
```

---

## 🔔 Notification System

### Notification Types
1. **Payment Approved** - User enrolled in course
2. **Payment Rejected** - Payment request rejected
3. **Live Stream Starting** - 24h, 1h, 15min before stream
4. **Lesson Available** - New lesson published
5. **Course Completed** - User finished all lessons
6. **Admin Message** - System announcements
7. **Instructor Message** - Course updates

### Resend Integration
```typescript
// lib/services/email.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendNotificationEmail(
  to: string,
  type: NotificationType,
  locale: 'en' | 'de' | 'ar',
  data: NotificationData
) {
  const template = getEmailTemplate(type, locale, data)
  
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to,
    subject: template.subject,
    html: template.html,
  })
}
```

### Notification Triggers
- **Automatic**: Payment status changes, course enrollment, live stream reminders
- **Manual**: Admin/Instructor can send notifications
- **Scheduled**: Live stream reminders (24h, 1h, 15min before)

### In-App Notifications
- Real-time updates using Server-Sent Events or polling
- Notification bell icon in navbar
- Mark as read functionality
- Link to related content

---

## 📹 Live Streaming Integration

### Microsoft Teams Integration

**Setup:**
1. Register app in Azure AD
2. Get Microsoft Graph API credentials
3. Store credentials in environment variables

**Features:**
1. **Create Teams Meeting**:
   ```typescript
   // When instructor schedules live lesson
   POST /api/teams/create-meeting
   {
     courseId: string,
     lessonId: string,
     scheduledDateTime: Date,
     title: string
   }
   ```

2. **Store Meeting Link**:
   - Save `teamsMeetingLink` in Lesson document
   - Update Course document if it's a live stream course

3. **Send Notifications**:
   - 24 hours before: "Your live class starts tomorrow at [time]"
   - 1 hour before: "Your live class starts in 1 hour"
   - 15 minutes before: "Join now: [Teams Link]"

4. **Access Control**:
   - Only enrolled students receive links
   - Link sent via notification (email + in-app)

**Cron Job** (Vercel Cron or similar):
```typescript
// Check for upcoming live streams every 5 minutes
// Send notifications at appropriate times
```

**Teams Chat Integration:**

Microsoft Teams provides native chat within meetings. For course-specific discussions:

1. **During Live Stream**: Teams built-in chat is automatically available
2. **Chat History**: Can be retrieved via Microsoft Graph API (with proper permissions)
3. **Course Discussion**: Implement custom chat for course-wide discussions outside of live streams

**Teams Chat API:**
```typescript
// lib/services/teams-chat.ts
// Retrieve chat messages from Teams meeting (if API allows)
export async function getTeamsChatMessages(meetingId: string) {
  // Use Microsoft Graph API to fetch chat messages
  // Requires: Chat.Read permission
}
```

**Custom Chat Implementation (Alternative):**
If Teams chat API is limited, implement custom course chat:
- Real-time messaging using WebSockets (Socket.io)
- Store messages in ChatMessage collection
- Show chat during live streams and course pages
- Persist chat history for course discussions
- Instructor moderation capabilities

**Chat API Routes:**
```
GET    /api/chat/course/[courseId]       # Get course chat messages
GET    /api/chat/lesson/[lessonId]      # Get lesson-specific chat
POST   /api/chat                          # Send chat message
PUT    /api/chat/[messageId]              # Edit message
DELETE /api/chat/[messageId]             # Delete message
POST   /api/chat/[messageId]/pin          # Pin message (instructor)
POST   /api/chat/[messageId]/reaction     # Add emoji reaction
```

---

## 🌍 Multi-language Support

### Implementation Strategy
1. **Database**: Store all user-facing content in 3 languages
2. **UI**: Use `next-intl` for interface translations
3. **URLs**: `/[locale]/courses/[slug]`
4. **RTL Support**: Arabic (right-to-left) layout

### Content Management
- **Instructors**: Can write course content in all 3 languages
- **Admins**: Can manage articles, settings in all languages
- **Users**: See content in their preferred locale

### Language Detection
- Browser language detection
- User preference (stored in profile)
- URL-based locale routing

---

## 📝 CMS Features

### Landing Page Management

**Articles:**
- Admin can create/edit/delete articles
- Multi-language content
- Image uploads
- Display order control
- Publish/unpublish

**Social Links:**
- Add/edit social media links
- Custom icons
- Display order
- Show/hide individual links

**Hero Section:**
- Upload hero images
- Multi-language headlines
- CTA buttons

**Sections:**
- Courses preview section
- Testimonials
- Features section
- All manageable via admin dashboard

---

## 🎛️ Dashboard & Admin Panel

### Admin Dashboard (`/dashboard/admin`)
**Sections:**
1. **Overview**
   - Total users, courses, enrollments
   - Revenue statistics
   - Recent activities

2. **User Management**
   - List all users
   - Filter by role
   - Create/edit/delete users
   - Activate/deactivate accounts
   - View user enrollments

3. **Course Management**
   - View all courses
   - Approve/reject courses (if required)
   - Edit any course
   - View course analytics

4. **Payment Management**
   - List all payment requests
   - Filter by status
   - Approve/reject payments
   - View receipts

5. **Content Management**
   - Manage articles
   - Manage social links
   - Landing page settings

6. **Settings**
   - System settings
   - Email configuration
   - Teams integration settings
   - Payment methods configuration (country-specific)
   - Instructor permissions

7. **Monitoring** (NEW)
   - Service usage dashboard
   - Email usage tracking
   - File upload monitoring
   - Database metrics
   - Alert configuration

8. **Notifications**
   - Send system-wide notifications
   - View notification history

### Instructor Dashboard (`/dashboard/instructor`)
**Sections:**
1. **My Courses**
   - List own courses
   - Create new course
   - Edit courses
   - View course analytics

2. **Students**
   - View enrolled students per course
   - Student progress tracking
   - Control material access

3. **Payments**
   - View payment requests for own courses
   - Approve/reject (if allowed by admin)

4. **Live Streams**
   - Schedule live lessons
   - Generate Teams links
   - View upcoming streams

5. **Analytics**
   - Course views
   - Enrollment statistics
   - Revenue (if applicable)

### User Dashboard (`/dashboard/user`)
**Sections:**
1. **My Courses**
   - Enrolled courses
   - Course progress
   - Continue learning

2. **Payments**
   - Payment history
   - Pending payments
   - Receipts

3. **Notifications**
   - All notifications
   - Mark as read
   - Filter by type

4. **Profile**
   - Edit profile
   - Change password
   - Language preference

---

## 📁 File Structure

```
courses-test/
├── app/
│   ├── [locale]/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── (public)/
│   │   │   ├── page.tsx                    # Landing page
│   │   │   ├── courses/
│   │   │   │   ├── page.tsx                # Course listing
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx            # Course detail
│   │   │   └── payment/
│   │   │       └── [courseId]/
│   │   │           └── page.tsx
│   │   └── dashboard/
│   │       ├── (admin)/
│   │       │   ├── page.tsx
│   │       │   ├── users/
│   │       │   ├── courses/
│   │       │   ├── payments/
│   │       │   ├── content/
│   │       │   └── settings/
│   │       ├── (instructor)/
│   │       │   ├── page.tsx
│   │       │   ├── courses/
│   │       │   ├── students/
│   │       │   └── analytics/
│   │       └── (user)/
│   │           ├── page.tsx
│   │           ├── my-courses/
│   │           ├── payments/
│   │           └── notifications/
│   └── api/
│       ├── auth/
│       │   └── [...nextauth]/
│       ├── courses/
│       ├── payments/
│       ├── enrollments/
│       ├── notifications/
│       ├── teams/
│       ├── chat/
│       └── admin/
├── lib/
│   ├── mongodb/
│   │   ├── connection.ts
│   │   └── models/
│   │       ├── User.ts
│   │       ├── Course.ts
│   │       ├── Lesson.ts
│   │       ├── Enrollment.ts
│   │       ├── Payment.ts
│   │       ├── Notification.ts
│   │       ├── Article.ts
│   │       ├── SocialLink.ts
│   │       ├── Settings.ts
│   │       ├── PaymentMethodConfig.ts
│   │       ├── EmailLog.ts
│   │       ├── SystemMetrics.ts
│   │       └── ChatMessage.ts
│   ├── auth/
│   │   ├── config.ts
│   │   ├── permissions.ts
│   │   └── middleware.ts
│   ├── services/
│   │   ├── email.ts                    # Resend integration
│   │   ├── teams.ts                    # Microsoft Teams API
│   │   └── notifications.ts
│   ├── monitoring/
│   │   ├── email-monitor.ts            # Email usage tracking
│   │   ├── cloudinary-monitor.ts       # File upload tracking
│   │   └── mongodb-monitor.ts          # Database metrics
│   └── utils/
│       ├── validations.ts              # Zod schemas
│       └── helpers.ts
├── components/
│   ├── dashboard/
│   │   ├── AdminDashboard.tsx
│   │   ├── InstructorDashboard.tsx
│   │   └── UserDashboard.tsx
│   ├── courses/
│   │   ├── CourseCard.tsx
│   │   ├── CourseForm.tsx
│   │   ├── LessonPlayer.tsx
│   │   ├── VideoPlayer.tsx
│   │   ├── TeamsLiveStream.tsx
│   │   └── LiveChat.tsx
│   ├── payments/
│   │   ├── PaymentForm.tsx
│   │   ├── PaymentMethodSelector.tsx
│   │   └── PaymentMethodCard.tsx
│   └── notifications/
│       └── NotificationBell.tsx
├── types/
│   ├── auth.ts
│   ├── database.ts
│   └── api.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useNotifications.ts
│   └── useCourses.ts
└── .env.local
```

---

## 📊 Service Monitoring & Usage Tracking

### Overview
For **100 users in the first 6 months**, all free tiers are sufficient. However, monitoring is essential to:
- Track usage and avoid unexpected limits
- Plan for upgrades when needed
- Optimize resource usage
- Get alerts before hitting limits

### Free Tier Limits Summary

| Service | Free Tier Limit | Expected Usage (100 users) | Status |
|---------|----------------|---------------------------|--------|
| **MongoDB Atlas** | 512 MB storage | ~50-100 MB | ✅ Safe |
| **Resend** | 100 emails/day, 3,000/month | ~40-80 emails/day | ⚠️ Monitor |
| **Cloudinary** | 25 credits/month | ~10-20 credits/month | ✅ Safe |
| **Vercel** | 100 GB bandwidth/month | ~5-10 GB/month | ✅ Safe |
| **Microsoft Teams** | Free (no billing) | Unlimited | ✅ Safe |

### Monitoring Implementation

#### 1. Email Monitoring (Resend)

**EmailLog Model** tracks every email sent:
- Log every email send attempt
- Track success/failure
- Count daily and monthly totals
- Alert when approaching limits

**Implementation:**
```typescript
// lib/services/email.ts
import { EmailLog } from '@/lib/mongodb/models/EmailLog'

export async function sendNotificationEmail(...) {
  try {
    const result = await resend.emails.send({...})
    
    // Log successful send
    await EmailLog.create({
      userId,
      to,
      type,
      subject,
      status: 'sent',
      resendId: result.id,
      metadata: { courseId, paymentId, locale }
    })
    
    return result
  } catch (error) {
    // Log failed send
    await EmailLog.create({
      userId,
      to,
      type,
      subject,
      status: 'failed',
      error: error.message,
      metadata: { courseId, paymentId, locale }
    })
    throw error
  }
}
```

**Daily Email Count Check:**
```typescript
// lib/monitoring/email-monitor.ts
export async function getEmailUsage(date: Date = new Date()) {
  const startOfDay = new Date(date.setHours(0, 0, 0, 0))
  const endOfDay = new Date(date.setHours(23, 59, 59, 999))
  
  const sent = await EmailLog.countDocuments({
    status: 'sent',
    createdAt: { $gte: startOfDay, $lte: endOfDay }
  })
  
  const failed = await EmailLog.countDocuments({
    status: 'failed',
    createdAt: { $gte: startOfDay, $lte: endOfDay }
  })
  
  const limit = 100 // Resend free tier daily limit
  const percentage = (sent / limit) * 100
  
  return {
    sent,
    failed,
    limit,
    percentage,
    remaining: limit - sent,
    isNearLimit: percentage >= 80,
    isOverLimit: sent >= limit
  }
}
```

#### 2. File Upload Monitoring (Cloudinary)

**Track Material uploads:**
- Each Material document includes file size
- Calculate Cloudinary credits used
- Monitor monthly usage

**Implementation:**
```typescript
// lib/monitoring/cloudinary-monitor.ts
export async function getCloudinaryUsage(month: number, year: number) {
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0)
  
  const materials = await Material.find({
    createdAt: { $gte: startDate, $lte: endDate }
  })
  
  let creditsUsed = 0
  materials.forEach(material => {
    if (material.type === 'video') creditsUsed += 5  // Video = 5 credits
    else if (material.type === 'pdf') creditsUsed += 1  // PDF = 1 credit
    else creditsUsed += 1  // Other = 1 credit
  })
  
  const limit = 25 // Cloudinary free tier
  const percentage = (creditsUsed / limit) * 100
  
  return {
    creditsUsed,
    limit,
    percentage,
    remaining: limit - creditsUsed,
    isNearLimit: percentage >= 80,
    filesUploaded: materials.length
  }
}
```

#### 3. Database Monitoring (MongoDB Atlas)

**Use Atlas Built-in Monitoring:**
- Atlas dashboard provides real-time metrics
- Set up email alerts for:
  - Storage > 400 MB (80% of 512 MB)
  - Connection count > 80% of limit
  - High CPU usage

**Internal Tracking:**
```typescript
// lib/monitoring/mongodb-monitor.ts
export async function getMongoDBMetrics() {
  // Get database stats
  const stats = await mongoose.connection.db.stats()
  
  const storageUsedMB = (stats.dataSize + stats.indexSize) / (1024 * 1024)
  const limitMB = 512 // Free tier limit
  const percentage = (storageUsedMB / limitMB) * 100
  
  return {
    storageUsedMB: Math.round(storageUsedMB * 100) / 100,
    limitMB,
    percentage: Math.round(percentage * 100) / 100,
    collections: stats.collections,
    indexes: stats.indexes,
    isNearLimit: percentage >= 80
  }
}
```

#### 4. System Metrics Dashboard

**Admin Dashboard Section: `/dashboard/admin/monitoring`**

**Display:**
- **Email Usage**: Daily/Monthly counts, percentage used, alerts
- **File Storage**: Cloudinary credits used, files uploaded
- **Database**: Storage used, collections count
- **Bandwidth**: Vercel usage (if available via API)
- **Alerts**: Warnings when approaching limits

**Visual Indicators:**
- 🟢 Green: < 50% of limit
- 🟡 Yellow: 50-80% of limit
- 🔴 Red: > 80% of limit

**Implementation:**
```typescript
// app/api/admin/monitoring/route.ts
export async function GET() {
  const [emailUsage, cloudinaryUsage, mongoMetrics] = await Promise.all([
    getEmailUsage(),
    getCloudinaryUsage(new Date().getMonth() + 1, new Date().getFullYear()),
    getMongoDBMetrics()
  ])
  
  return Response.json({
    email: emailUsage,
    cloudinary: cloudinaryUsage,
    mongodb: mongoMetrics,
    timestamp: new Date()
  })
}
```

### Automated Alerts

**Daily Cron Job** (Vercel Cron or similar):
```typescript
// app/api/cron/monitoring/route.ts
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  const emailUsage = await getEmailUsage()
  const cloudinaryUsage = await getCloudinaryUsage(...)
  const mongoMetrics = await getMongoDBMetrics()
  
  // Send alerts if near limits
  if (emailUsage.isNearLimit) {
    await sendAdminAlert('email', emailUsage)
  }
  if (cloudinaryUsage.isNearLimit) {
    await sendAdminAlert('cloudinary', cloudinaryUsage)
  }
  if (mongoMetrics.isNearLimit) {
    await sendAdminAlert('mongodb', mongoMetrics)
  }
  
  // Update SystemMetrics document
  await SystemMetrics.findOneAndUpdate(
    { date: new Date().toISOString().split('T')[0], service: 'resend' },
    { metrics: { emailsSent: emailUsage.sent, ... }, ... },
    { upsert: true }
  )
  
  return Response.json({ success: true })
}
```

### MongoDB Atlas Alerts Setup

**Recommended Alerts:**
1. **Storage Alert**: Email when storage > 400 MB
2. **Connection Alert**: Email when connections > 80% of limit
3. **CPU Alert**: Email when CPU > 80% for 5+ minutes

**Setup Steps:**
1. Go to MongoDB Atlas → Project → Alerts
2. Create alert for "Disk Space Used" > 400 MB
3. Create alert for "Connection Count" > threshold
4. Add admin email addresses

### Cost Projection (100 Users)

**Months 1-3: $0/month**
- All services within free tiers
- Email: ~40-60/day
- Storage: ~50-80 MB
- Files: ~5-10/month

**Months 4-6: $0-20/month**
- May need Resend Pro ($20/month) if email volume increases
- Other services still within free tiers

**Upgrade Triggers:**
- **Resend**: If consistently > 80 emails/day → Upgrade to Pro
- **Cloudinary**: If consistently > 20 credits/month → Consider Plus plan
- **MongoDB**: If storage > 400 MB → Consider M2 ($9/month)

### Monitoring Best Practices

1. **Check Daily**: Review email usage daily
2. **Weekly Review**: Check all metrics weekly in admin dashboard
3. **Monthly Audit**: Review monthly totals and trends
4. **Set Alerts**: Configure MongoDB Atlas alerts
5. **Optimize**: Reduce email sends, compress files, clean old data

---

## 🚀 Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [X] MongoDB setup and connection
- [X] User models and authentication (NextAuth + JWT)
- [X] Role-based access control
- [X] Login/Signup pages
- [X] Basic dashboard structure

### Phase 2: Course System (Week 3-4)
- [ ] Course models and schemas
- [ ] Course creation (instructor)
- [ ] Course listing and search
- [ ] Course detail pages
- [ ] Multi-language course content
- [ ] Video player component (pre-recorded lessons)
- [ ] Live stream integration (jitsi)
- [ ] Live chat component (jitsi + custom chat)
- [ ] Progress tracking

### Phase 3: Payment System (Week 5)
- [ ] Payment model and API
- [ ] PaymentMethodConfig model (country-specific methods)
- [ ] Payment page with country detection
- [ ] Dynamic payment method display based on country
- [ ] Payment method thumbnails and QR codes
- [ ] Admin payment method management (add/edit/delete)
- [ ] Custom payment method creation (phone, wallet, QR code)
- [ ] Syrian payment methods setup (MTN Cash, Syriatel Cash, etc.)
- [ ] Payment page with receipt upload
- [ ] Payment review system (admin/instructor)
- [ ] Enrollment creation on approval

### Phase 4: Notifications (Week 6)
- [ ] Notification model
- [ ] Resend email integration
- [ ] In-app notifications
- [ ] Notification triggers

### Phase 5: Live Streaming (Week 7)
- [ ] Microsoft Teams API integration
- [ ] Live lesson scheduling
- [ ] Automated notification system
- [ ] Teams link distribution

### Phase 6: CMS & Content (Week 8)
- [ ] Article management
- [ ] Social links management
- [ ] Landing page customization
- [ ] Dynamic content rendering

### Phase 7: Advanced Features (Week 9-10)
- [ ] Student management (instructor)
- [ ] Material access control
- [ ] Analytics dashboards
- [ ] Settings management
- [ ] Search and filtering
- [ ] Service monitoring system
- [ ] Email usage tracking
- [ ] Admin monitoring dashboard

### Phase 8: Polish & Testing (Week 11-12)
- [ ] Multi-language UI completion
- [ ] RTL support for Arabic
- [ ] Testing all features
- [ ] Performance optimization
- [ ] Security audit

---

## 🔧 Environment Variables

```env
# Database
MONGODB_URI=mongodb+srv://...

# Authentication
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Email (Resend)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Microsoft Teams
MICROSOFT_CLIENT_ID=...
MICROSOFT_CLIENT_SECRET=...
MICROSOFT_TENANT_ID=...

# File Uploads (Cloudinary/Uploadthing)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# App
APP_URL=http://localhost:3000

# Cron Jobs (for monitoring)
CRON_SECRET=your-cron-secret-key
```

---

## 🎨 Additional Features to Consider

1. **Course Reviews & Ratings**
   - Students can rate and review courses
   - Display average ratings

2. **Course Certificates**
   - Generate certificates on course completion
   - PDF download

3. **Discussion Forums**
   - Course-specific forums
   - Q&A sections

4. **Progress Tracking**
   - Visual progress bars
   - Completion certificates

5. **Wishlist**
   - Save courses for later
   - Price drop notifications

6. **Referral System**
   - Referral codes
   - Discounts for referrals

7. **Analytics Dashboard**
   - Course performance metrics
   - Student engagement analytics
   - Revenue reports

8. **Mobile App Ready**
   - API-first architecture
   - RESTful endpoints

---

## 📚 Key Libraries to Install

```bash
# Core
pnpm add mongoose @types/mongoose
pnpm add next-auth@beta
pnpm add bcryptjs @types/bcryptjs
pnpm add jsonwebtoken @types/jsonwebtoken

# Validation
pnpm add zod

# Email
pnpm add resend

# Microsoft Teams
pnpm add @microsoft/microsoft-graph-client
pnpm add @microsoft/teams-js  # Teams SDK for embedded meetings

# File Upload
pnpm add cloudinary
# OR
pnpm add @uploadthing/react @uploadthing/server

# UI Components
pnpm add shadcn-ui
pnpm add lucide-react  # Icons

# Forms
pnpm add react-hook-form
pnpm add @hookform/resolvers

# Date handling
pnpm add date-fns

# Notifications
pnpm add react-hot-toast

# Real-time Chat (if custom chat needed)
pnpm add socket.io socket.io-client
# OR
pnpm add @supabase/realtime-js  # Alternative for real-time features

# Video Player
pnpm add react-player  # Universal video player (supports YouTube, Vimeo, etc.)
pnpm add video.js @videojs/themes  # Advanced video player (optional)
```

---

## ✅ Next Steps

1. **Review this strategy** and adjust based on your needs
2. **Set up MongoDB Atlas** account
3. **Create Azure AD app** for Microsoft Teams
4. **Set up Resend account** for emails
5. **Start with Phase 1** - Foundation setup

---

**Ready to start implementation?** Let me know which phase you'd like to begin with, and I'll help you set it up step by step!
