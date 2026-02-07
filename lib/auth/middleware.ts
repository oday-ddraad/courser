import { authOptions } from './config';
import { UserRole } from '@/types/database';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";

// Define protected routes and their required roles
const protectedRoutes: Record<string, UserRole[]> = {
  // Admin routes
  '/admin': ['admin'],
  '/dashboard/admin': ['admin'],

  // Instructor routes
  '/dashboard/instructor': ['instructor'],

  // User routes (authenticated users)
  '/dashboard/user': ['user', 'instructor', 'admin'],
  '/dashboard': ['user', 'instructor', 'admin'],

  // Course management (instructors and admins)
  '/courses/new': ['instructor', 'admin'],
  '/courses/edit': ['instructor', 'admin'],
};

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/courses',
  '/courses/[slug]', // Course detail pages are public
  '/forbidden',
];

// Check if a path matches a protected route
function isProtectedRoute(pathname: string): UserRole[] | null {
  // Check exact matches first
  if (protectedRoutes[pathname]) {
    return protectedRoutes[pathname];
  }

  // Check pattern matches
  for (const [pattern, roles] of Object.entries(protectedRoutes)) {
    if (pattern.includes('[slug]')) {
      const regex = new RegExp(pattern.replace('[slug]', '[^/]+'));
      if (regex.test(pathname)) {
        return roles;
      }
    }
  }

  return null;
}

// Check if a path is public
function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => {
    if (route.includes('[slug]')) {
      const regex = new RegExp(route.replace('[slug]', '[^/]+'));
      return regex.test(pathname);
    }
    return pathname === route || pathname.startsWith(route + '/');
  });
}

export async function authMiddleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip middleware for API routes, static files, and Next.js internals
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next();
  }

  // Get session
  const session = await getServerSession(authOptions);

  // Check if route is protected
  const requiredRoles = isProtectedRoute(pathname);

  if (requiredRoles) {
    // Route requires authentication
    if (!session) {
      // Redirect to login
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('callbackUrl', req.url);
      return NextResponse.redirect(loginUrl);
    }

    // Check if user has required role
    const userRole = session.user?.role as UserRole;
    if (!userRole || !requiredRoles.includes(userRole)) {
      // Redirect to forbidden page
      return NextResponse.redirect(new URL('/forbidden', req.url));
    }
  } else if (!isPublicRoute(pathname)) {
    // If not protected and not public, assume it needs authentication
    if (!session) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('callbackUrl', req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}
