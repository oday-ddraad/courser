import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !['en', 'ar', 'de'].includes(locale)) {
    locale = 'en';
  }

  return {
    locale,
    // Points to the messages folder in the root
    messages: (await import(`../messages/${locale}.json`)).default
  };
});