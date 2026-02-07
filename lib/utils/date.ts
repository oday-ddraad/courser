/**
 * Date utility functions for formatting and displaying dates
 */

/**
 * Format a date to a relative time string (e.g., "2 hours ago", "3 days ago")
 */
export function formatDistanceToNow(date: string | Date, locale: string = 'en'): string {
  const now = new Date();
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);

  // Define time units in seconds
  const minute = 60;
  const hour = minute * 60;
  const day = hour * 24;
  const week = day * 7;
  const month = day * 30;
  const year = day * 365;

  // Translations for different locales
  const translations: Record<string, Record<string, string>> = {
    en: {
      justNow: 'just now',
      seconds: 'seconds ago',
      minute: 'a minute ago',
      minutes: 'minutes ago',
      hour: 'an hour ago',
      hours: 'hours ago',
      day: 'a day ago',
      days: 'days ago',
      week: 'a week ago',
      weeks: 'weeks ago',
      month: 'a month ago',
      months: 'months ago',
      year: 'a year ago',
      years: 'years ago',
    },
    de: {
      justNow: 'gerade eben',
      seconds: 'Sekunden her',
      minute: 'vor einer Minute',
      minutes: 'Minuten her',
      hour: 'vor einer Stunde',
      hours: 'Stunden her',
      day: 'vor einem Tag',
      days: 'Tage her',
      week: 'vor einer Woche',
      weeks: 'Wochen her',
      month: 'vor einem Monat',
      months: 'Monate her',
      year: 'vor einem Jahr',
      years: 'Jahre her',
    },
    ar: {
      justNow: 'الآن',
      seconds: 'ثوانٍ مضت',
      minute: 'دقيقة واحدة مضت',
      minutes: 'دقائق مضت',
      hour: 'ساعة واحدة مضت',
      hours: 'ساعات مضت',
      day: 'يوم واحد مضى',
      days: 'أيام مضت',
      week: 'أسبوع واحد مضى',
      weeks: 'أسابيع مضت',
      month: 'شهر واحد مضى',
      months: 'أشهر مضت',
      year: 'سنة واحدة مضت',
      years: 'سنوات مضت',
    },
  };

  const t = translations[locale] || translations.en;

  if (diffInSeconds < 10) {
    return t.justNow;
  } else if (diffInSeconds < minute) {
    return `${diffInSeconds} ${t.seconds}`;
  } else if (diffInSeconds < minute * 2) {
    return t.minute;
  } else if (diffInSeconds < hour) {
    return `${Math.floor(diffInSeconds / minute)} ${t.minutes}`;
  } else if (diffInSeconds < hour * 2) {
    return t.hour;
  } else if (diffInSeconds < day) {
    return `${Math.floor(diffInSeconds / hour)} ${t.hours}`;
  } else if (diffInSeconds < day * 2) {
    return t.day;
  } else if (diffInSeconds < week) {
    return `${Math.floor(diffInSeconds / day)} ${t.days}`;
  } else if (diffInSeconds < week * 2) {
    return t.week;
  } else if (diffInSeconds < month) {
    return `${Math.floor(diffInSeconds / week)} ${t.weeks}`;
  } else if (diffInSeconds < month * 2) {
    return t.month;
  } else if (diffInSeconds < year) {
    return `${Math.floor(diffInSeconds / month)} ${t.months}`;
  } else if (diffInSeconds < year * 2) {
    return t.year;
  } else {
    return `${Math.floor(diffInSeconds / year)} ${t.years}`;
  }
}

/**
 * Format a date to a localized string
 */
export function formatDate(date: string | Date, locale: string = 'en', options?: Intl.DateTimeFormatOptions): string {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  };

  return new Intl.DateTimeFormat(locale, defaultOptions).format(targetDate);
}

/**
 * Format a date to a localized date and time string
 */
export function formatDateTime(date: string | Date, locale: string = 'en'): string {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(targetDate);
}

/**
 * Check if a date is today
 */
export function isToday(date: string | Date): boolean {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  
  return (
    targetDate.getDate() === today.getDate() &&
    targetDate.getMonth() === today.getMonth() &&
    targetDate.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if a date is yesterday
 */
export function isYesterday(date: string | Date): boolean {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  return (
    targetDate.getDate() === yesterday.getDate() &&
    targetDate.getMonth() === yesterday.getMonth() &&
    targetDate.getFullYear() === yesterday.getFullYear()
  );
}

/**
 * Get relative date label (Today, Yesterday, or formatted date)
 */
export function getRelativeDateLabel(date: string | Date, locale: string = 'en'): string {
  if (isToday(date)) {
    const labels: Record<string, string> = {
      en: 'Today',
      de: 'Heute',
      ar: 'اليوم',
    };
    return labels[locale] || labels.en;
  }
  
  if (isYesterday(date)) {
    const labels: Record<string, string> = {
      en: 'Yesterday',
      de: 'Gestern',
      ar: 'أمس',
    };
    return labels[locale] || labels.en;
  }
  
  return formatDate(date, locale);
}
