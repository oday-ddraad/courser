import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
 
export default createMiddleware(routing);
 
export const config = {
  // Matches all routes except api, static files, and icons
  matcher: ['/((?!api|_next|.*\\..*).*)']
};