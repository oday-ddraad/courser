import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['en', 'ar', 'de'],
  defaultLocale: 'en',
  localePrefix: 'always', // Always show locale prefix to avoid redirect loops
});

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);