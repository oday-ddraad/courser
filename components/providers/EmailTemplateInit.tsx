'use client';

import { useEffect } from 'react';

/**
 * Component that initializes email templates on app startup
 * This runs automatically when the app loads
 */
export default function EmailTemplateInit() {
  useEffect(() => {
    // Initialize email templates on app startup
    const initTemplates = async () => {
      try {
        // Only run in production or when explicitly needed
        // This prevents unnecessary calls during development
        const response = await fetch('/api/init', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            console.log(`✅ Email templates initialized: ${data.created} created, ${data.existing} existing`);
          } else {
            console.warn('⚠️ Email template initialization warning:', data.message);
          }
        } else {
          console.error('❌ Failed to initialize email templates:', response.statusText);
        }
      } catch (error) {
        // Silently fail - don't break the app if templates can't be initialized
        console.error('Error initializing email templates:', error);
      }
    };

    // Run initialization
    initTemplates();
  }, []);

  // This component doesn't render anything
  return null;
}
