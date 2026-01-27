import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  // 1. Await the params
  const localeParam = await requestLocale;

  // 2. Determine final locale (ensure it's a string, never undefined)
  const locale = 
    localeParam && routing.locales.includes(localeParam as any)
      ? localeParam
      : routing.defaultLocale;

  return {
    locale, // TS now knows this is a string
    messages: (await import(`../messages/${locale}.json`)).default
  };
});