import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

// Create i18n middleware
const i18nMiddleware = createMiddleware(routing);

// Auth options for page routes
const authOptions = {
  callbacks: {
    authorized: ({ token, req }: any) => {
      const { pathname } = req.nextUrl;

      // Public routes that don't require authentication
      const publicRoutes = ['/login', '/register', '/forbidden'];

      // Check for root and localized root
      if (pathname === '/' || pathname.match(/^\/[a-z]{2}\/?$/)) {
        return true;
      }

      // Check for localized public routes
      for (const route of publicRoutes) {
        if (pathname.endsWith(route) || pathname.includes(route)) {
          return true;
        }
      }

      // Check for courses pages (public)
      if (pathname.match(/^\/[a-z]{2}\/courses/)) {
        return true;
      }

      // For all other routes, require authentication
      return !!token;
    },
  },
  pages: {
    signIn: '/login', // This will be handled by i18n routing
  },
};

// Custom middleware
const middleware = (req: any, event: any) => {
  const { pathname } = req.nextUrl;

  // Skip i18n and auth for API routes, static files, and Next.js internals
  if (
    pathname.includes('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon.ico')
  ) {
    // Allow all API and static routes without auth
    return NextResponse.next();
  }

  // Redirect /login to /en/login to avoid 404
  if (pathname === '/login') {
    return NextResponse.redirect(new URL('/en/login', req.url));
  }

  // For page routes, apply i18n and auth
  return withAuth(i18nMiddleware, authOptions)(req, event);
};

export default middleware;

export const config = {
  // Matches all routes except static files and icons
  matcher: ['/((?!_next|.*\\..*).*)']
};
