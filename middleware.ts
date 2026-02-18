import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { withAuth } from 'next-auth/middleware';
import { NextResponse, NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';



const i18nMiddleware = createMiddleware(routing);

const authMiddleware = withAuth(
  function onSuccess(req) {
    return i18nMiddleware(req);
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // 1. Identify public segments
        const publicPaths = ['/signin', '/register', '/forbidden', '/courses', '/login', '/complete-profile', '/verify-email', '/signup'];
        
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
          console.log('[middleware] No token, denying access to:', pathname);
          return false;
        }

        // 4. Check if profile is completed
        console.log('[middleware] Token profileCompleted:', token.profileCompleted);
        
        if (!token.profileCompleted) {
          // Allow access to profile completion and verification pages
          if (pathWithoutLocale.startsWith('/complete-profile') || 
              pathWithoutLocale.startsWith('/verify-email')) {
            console.log('[middleware] Allowing access to profile completion page');
            return true;
          }
          console.log('[middleware] Profile incomplete, denying access to:', pathname);
          return false;
        }

        // 5. User is authenticated and profile is complete
        console.log('[middleware] Access granted to:', pathname);
        return true;

      },
    },
    pages: {
      signIn: '/login', 
    },
  }
);

export default async function middleware(req: NextRequest, event: any) {
  const { pathname } = req.nextUrl;

  console.log('[middleware] Processing:', pathname);

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
  const publicPaths = ['/signin', '/register', '/forbidden', '/courses', '/login', '/complete-profile', '/verify-email', '/signup'];
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(\/|$)/, '/');
  const isPublic = publicPaths.some(path => pathWithoutLocale.startsWith(path)) || pathWithoutLocale === '/';

  if (isPublic) {
    console.log('[middleware] Public path, allowing:', pathname);
    return i18nMiddleware(req);
  }

  // 3. For protected routes, check if user is authenticated and profile is complete
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  
  console.log('[middleware] Token for protected route:', token ? {
    id: token.id,
    profileCompleted: token.profileCompleted,
    provider: token.provider
  } : 'null');

  // If user is authenticated but profile is incomplete, redirect to complete-profile
  if (token && !token.profileCompleted) {
    console.log('[middleware] Profile incomplete, redirecting to complete-profile');
    
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
  matcher: ['/((?!api|_next|.*\\..*).*)']
};
