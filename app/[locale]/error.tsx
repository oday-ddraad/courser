"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("Errors");

  useEffect(() => {
    // Log the error to an error reporting service (Sentry, LogRocket, etc.)
    console.error("Application Error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30">
        <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
        {t("somethingWentWrong") || "Something went wrong!"}
      </h2>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        We encountered an unexpected error. Don't worry, your data is safe.
      </p>

      <div className="mt-8 flex space-x-4 rtl:space-x-reverse">
        <button
          onClick={() => reset()}
          className="rounded-full bg-blue-600 px-8 py-3 font-semibold text-white shadow-lg transition-all hover:bg-blue-700 active:scale-95"
        >
          {t("tryAgain") || "Try Again"}
        </button>
        
        <button
          onClick={() => window.location.href = "/"}
          className="rounded-full border border-slate-300 px-8 py-3 font-semibold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {t("goHome")}
        </button>
      </div>
    </div>
  );
}