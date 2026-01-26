export default function Loading() {
  return (
    <div className="flex h-[70vh] w-full flex-col items-center justify-center space-y-4">
      {/* Material Spinner */}
      <div className="relative h-16 w-16">
        <div className="absolute h-full w-full rounded-full border-4 border-slate-200 dark:border-slate-800"></div>
        <div className="absolute h-full w-full animate-spin rounded-full border-4 border-blue-600 border-t-transparent shadow-md"></div>
      </div>
      <p className="animate-pulse text-sm font-medium text-slate-500 dark:text-slate-400">
        Preparing your experience...
      </p>
    </div>
  );
}