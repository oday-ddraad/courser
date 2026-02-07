import { getServerSession } from 'next-auth';
import { authOptions } from './config';
import { UserRole } from '@/types/database';

/**
 * Get the current user's role from the session
 * @returns UserRole or null if not authenticated
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.role as UserRole || null;
}

/**
 * Get the current user session
 * @returns Session or null
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user || null;
}

/**
 * Check if current user has a specific permission
 * @param permission - The permission to check
 * @returns boolean
 */
export async function currentUserHasPermission(permission: string): Promise<boolean> {
  const role = await getCurrentUserRole();
  if (!role) return false;

  const { hasPermission } = await import('./permissions');
  return hasPermission(role, permission);
}

/**
 * Check if current user has any of the specified permissions
 * @param permissions - Array of permissions to check
 * @returns boolean
 */
export async function currentUserHasAnyPermission(permissions: string[]): Promise<boolean> {
  const role = await getCurrentUserRole();
  if (!role) return false;

  const { hasAnyPermission } = await import('./permissions');
  return hasAnyPermission(role, permissions);
}

/**
 * Check if current user has all of the specified permissions
 * @param permissions - Array of permissions to check
 * @returns boolean
 */
export async function currentUserHasAllPermissions(permissions: string[]): Promise<boolean> {
  const role = await getCurrentUserRole();
  if (!role) return false;

  const { hasAllPermissions } = await import('./permissions');
  return hasAllPermissions(role, permissions);
}
