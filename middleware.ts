import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { withAuth } from 'next-auth/middleware';
import { NextResponse, NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

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
        const publicPaths = ['/signin', '/register', '/forbidden', '/courses', '/login', '/complete-profile', '/verify-email'];
        
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

        // 3. Require token for protected routes
        if (!token) {
          return false;
        }

        // 4. Check if profile is completed
        // Token will have profileCompleted flag from JWT callback
        if (!token.profileCompleted) {
          // Allow access to profile completion and verification pages
          if (pathWithoutLocale.startsWith('/complete-profile') || 
              pathWithoutLocale.startsWith('/verify-email')) {
            return true;
          }
          // User is authenticated but profile is incomplete
          // Return false to trigger redirect, we'll handle it in main middleware
          return false;
        }

        // 5. User is authenticated and profile is complete
        return true;

      },
    },
    pages: {
      // If unauthorized, the user is sent here. 
      signIn: '/login', 
    },
  }
);


export default async function middleware(req: NextRequest, event: any) {

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
  const publicPaths = ['/signin', '/register', '/forbidden', '/courses', '/login', '/complete-profile', '/verify-email'];
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(\/|$)/, '/');
  const isPublic = publicPaths.some(path => pathWithoutLocale.startsWith(path)) || pathWithoutLocale === '/';

  if (isPublic) {
    return i18nMiddleware(req);
  }

  // 3. For protected routes, first check if user is authenticated and profile is complete
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  
  // If user is authenticated but profile is incomplete, redirect to complete-profile
  if (token && !token.profileCompleted) {
    // Extract locale from pathname
    const localeMatch = pathname.match(/^\/([a-z]{2})(\/|$)/);
    const locale = localeMatch ? localeMatch[1] : 'en';
    
    // Redirect to complete-profile
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}/complete-profile`;
    return NextResponse.redirect(url);
  }

  // 4. Run authMiddleware for other cases
  // @ts-ignore
  const response = await authMiddleware(req, event);
  
  return response;

}

export const config = {
  // Catch-all but ignore static files
  matcher: ['/((?!api|_next|.*\\..*).*)']
};
