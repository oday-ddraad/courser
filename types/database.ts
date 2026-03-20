// Type definitions for database models
// These types are exported for use throughout the application
import { DefaultSession } from "next-auth";
import { ObjectId } from 'mongoose';

// User Types
export type UserRole = 'admin' | 'instructor' | 'user';
export type Locale = 'en' | 'de' | 'ar';
export type CountryCode = string; // ISO 3166-1 alpha-2 (e.g., 'US', 'DE', 'SA', 'SY')

// Course Types
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';
export type EnrollmentStatus = 'pending' | 'active' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'expired' | 'refunded';

export type PaymentMethodType = 
  | 'bank_transfer' 
  | 'credit_card' 
  | 'paypal' 
  | 'mobile_wallet' 
  | 'crypto' 
  | 'custom';

export type PaymentProofRequirement = 'operation_number' | 'screenshot' | 'both' | 'none';


// Notification Types
export type NotificationType = 
  | 'payment_approved' 
  | 'payment_rejected'
  | 'payment_pending_review'
  | 'payment_resubmitted'
  | 'payment_expired'
  | 'payment_reminder'
  | 'payment_refunded'
  | 'new_enrollment_instructor'
  | 'course_enrolled' 
  | 'live_stream_starting' 
  | 'lesson_available' 
  | 'course_completed' 
  | 'admin_message' 
  | 'instructor_message'
  | 'course_approved'
  | 'course_rejected'
  | 'course_submitted';



// Multi-language content type
export interface MultiLanguageContent {
  en: string;
  de: string;
  ar: string;
}

// Common document interface
export interface BaseDocument {
  _id: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}


// ... your existing CourseLevel, UserRole, etc.

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      profileCompleted: boolean;
      provider: 'credentials' | 'google';
      avatar?: string;
      emailVerified: Date | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: UserRole;
    profileCompleted: boolean;
    provider: 'credentials' | 'google';
    avatar?: string;
    emailVerified: Date | null;
  }
}


declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    profileCompleted: boolean;
    provider: 'credentials' | 'google';
    emailVerified: Date | null;
    version?: number; // For global revocation
  }
}
