import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { withAuth } from 'next-auth/middleware';
import { NextResponse, NextRequest } from 'next/server';

const i18nMiddleware = createMiddleware(routing);

const authMiddleware = withAuth(
  // This runs AFTER the authorized callback returns true
  function onSuccess(req) {
    return i18nMiddleware(req);
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // 1. Identify public segments
        const publicPaths = ['/signin', '/register', '/forbidden', '/courses', '/login'];
        
        // Remove the locale prefix (e.g., /en/login -> /login) to check against publicPaths
        const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(\/|$)/, '/');

        // 2. Allow root and public paths
        if (
          pathname === '/' || 
          pathWithoutLocale === '/' ||
          publicPaths.some(path => pathWithoutLocale.startsWith(path))
        ) {
          return true;
        }

        // 3. Require token for everything else (dashboard, etc.)
        return !!token;
      },
    },
    pages: {
      // If unauthorized, the user is sent here. 
      // Note: We handle the locale redirect in the main middleware function below.
      signIn: '/login', 
    },
  }
);

export default function middleware(req: NextRequest, event: any) {
  const { pathname } = req.nextUrl;

  // 1. Exclude internal/static files
  if (
    pathname.startsWith('/_next') ||
    pathname.includes('/api/') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next();
  }

  // 2. Check if it's a public route that needs i18n but NO auth
  const publicPaths = ['/signin', '/register', '/forbidden', '/courses', '/login'];
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(\/|$)/, '/');
  const isPublic = publicPaths.some(path => pathWithoutLocale.startsWith(path)) || pathWithoutLocale === '/';

  if (isPublic) {
    return i18nMiddleware(req);
  }

  // 3. For protected routes, run authMiddleware
  // @ts-ignore
  return authMiddleware(req, event);
}

export const config = {
  // Catch-all but ignore static files
  matcher: ['/((?!api|_next|.*\\..*).*)']
};