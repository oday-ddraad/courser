import { UserRole } from '@/types/database';
import { NextRequest, NextResponse } from 'next/server';

// Define permissions for each role
export const PERMISSIONS: Record<UserRole, readonly string[]> = {
  // Admin permissions
  admin: [
    'user.manage',           // Create, edit, delete, activate/deactivate users
    'course.manage',         // Manage all courses
    'payment.approve',       // Approve/reject payments
    'payment.method.manage', // Manage payment methods
    'content.manage',        // Manage articles, social links
    'settings.manage',       // System settings
    'analytics.view',        // View all analytics
    'instructor.permissions.manage', // Control instructor permissions
    'notification.send',     // Send system notifications
  ],

  // Instructor permissions
  instructor: [
    'course.create',         // Create own courses
    'course.edit',           // Edit own courses
    'course.upload',         // Upload course materials
    'course.price.set',      // Set course prices
    'course.live.schedule',  // Schedule live streams
    'course.material.control', // Control material access
    'course.analytics.view', // View own course analytics
    'student.view',          // View enrolled students
    'payment.approve',       // Approve payments for own courses (if admin allows)
    'notification.send',     // Send course notifications
  ],

  // User permissions
  user: [
    'course.browse',         // Browse and search courses
    'course.preview',        // View course previews
    'course.purchase',       // Purchase courses
    'payment.upload',        // Upload payment receipts
    'course.access',         // Access purchased courses
    'course.material.download', // Download course materials
    'live.join',             // Join live streams
    'notification.receive',  // Receive notifications
    'profile.update',        // Update profile
  ],
};

// Check if a role has a specific permission
export function hasPermission(role: UserRole, permission: string): boolean {
  return PERMISSIONS[role]?.includes(permission) ?? false;
}

// Check if a role has any of the required permissions
export function hasAnyPermission(role: UserRole, permissions: string[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

// Check if a role has all required permissions
export function hasAllPermissions(role: UserRole, permissions: string[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}

// Middleware function to require specific permissions
export function requirePermission(permission: string) {
  return async (req: NextRequest) => {
    // This will be used in API routes
    // The actual session check will be done in the route handler
    // This is just a type guard for TypeScript
    return null;
  };
}

// Middleware function to require role
export function requireRole(allowedRoles: UserRole[]) {
  return async (req: NextRequest) => {
    // This will be used in API routes
    // The actual session check will be done in the route handler
    return null;
  };
}

// Role hierarchy (higher number = more permissions)
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  user: 1,
  instructor: 2,
  admin: 3,
};

// Check if role A has equal or higher permissions than role B
export function hasRoleLevel(roleA: UserRole, roleB: UserRole): boolean {
  return ROLE_HIERARCHY[roleA] >= ROLE_HIERARCHY[roleB];
}

// Get all permissions for a role including inherited ones
export function getAllPermissions(role: UserRole): string[] {
  const permissions = [...PERMISSIONS[role]];

  // Add user permissions to instructor and admin
  if (role === 'instructor' || role === 'admin') {
    permissions.push(...PERMISSIONS.user);
  }

  // Add instructor permissions to admin
  if (role === 'admin') {
    permissions.push(...PERMISSIONS.instructor);
  }

  return [...new Set(permissions)]; // Remove duplicates
}
