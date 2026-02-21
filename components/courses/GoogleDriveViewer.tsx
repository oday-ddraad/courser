'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';

interface GoogleDriveLink {
  _id: string;
  name: {
    en: string;
    de: string;
    ar: string;
  };
  url: string;
  type: 'folder' | 'file' | 'document' | 'spreadsheet' | 'presentation';
}

interface GoogleDriveViewerProps {
  links: GoogleDriveLink[];
  locale: string;
}

const typeIcons = {
  folder: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-4-4H5a2 2 0 00-2 2z" />
    </svg>
  ),
  file: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  document: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  spreadsheet: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  presentation: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
    </svg>
  ),
};

const typeColors = {
  folder: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20',
  file: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
  document: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
  spreadsheet: 'text-green-600 bg-green-50 dark:bg-green-900/20',
  presentation: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20',
};

export default function GoogleDriveViewer({ links, locale }: GoogleDriveViewerProps) {
  const [expanded, setExpanded] = useState(false);

  if (!links || links.length === 0) {
    return null;
  }

  const displayedLinks = expanded ? links : links.slice(0, 3);
  const hasMore = links.length > 3;

  const getLocalizedName = (name: { en: string; de: string; ar: string }) => {
    return name[locale as keyof typeof name] || name.en || 'Untitled';
  };

  const getLocalizedType = (type: string) => {
    const labels: Record<string, Record<string, string>> = {
      folder: { en: 'Folder', de: 'Ordner', ar: 'مجلد' },
      file: { en: 'File', de: 'Datei', ar: 'ملف' },
      document: { en: 'Document', de: 'Dokument', ar: 'مستند' },
      spreadsheet: { en: 'Spreadsheet', de: 'Tabelle', ar: 'جدول' },
      presentation: { en: 'Presentation', de: 'Präsentation', ar: 'عرض تقديمي' },
    };
    return labels[type]?.[locale] || labels[type]?.en || type;
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
        </svg>
        {locale === 'ar' ? 'مواد الدورة' : locale === 'de' ? 'Kursmaterialien' : 'Course Materials'}
      </h4>
      
      <div className="space-y-2">
        {displayedLinks.map((link) => (
          <a
            key={link._id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-3 p-3 rounded-lg ${typeColors[link.type]} hover:opacity-80 transition-opacity group`}
          >
            <div className="flex-shrink-0">
              {typeIcons[link.type]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {getLocalizedName(link.name)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {getLocalizedType(link.type)}
              </p>
            </div>
            <svg 
              className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 flex-shrink-0" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
        >
          {expanded 
            ? (locale === 'ar' ? 'عرض أقل' : locale === 'de' ? 'Weniger anzeigen' : 'Show less')
            : (locale === 'ar' ? `عرض ${links.length - 3} أكثر` : locale === 'de' ? `${links.length - 3} mehr anzeigen` : `Show ${links.length - 3} more`)
          }
        </button>
      )}
    </div>
  );
}
