# Fix Turbopack Crashes

## Problem
Turbopack is crashing repeatedly due to the space in your folder path: `"nextjs template"`

## Solution: Disable Turbopack

Turbopack (Next.js's new bundler) has issues with paths containing spaces on Windows. Use the standard webpack bundler instead.

### Option 1: Use Standard Bundler (Recommended)

**Stop the current server (Ctrl+C) and restart with:**

```powershell
# This uses webpack instead of Turbopack
next dev
```

**OR if you're using pnpm/npm scripts:**

```powershell
# The default "dev" script will use webpack
pnpm dev
# or
npm run dev
```

### Option 2: Explicitly Disable Turbopack

If Turbopack is still being used, explicitly disable it:

```powershell
next dev --no-turbo
```

## Why This Happens

- Turbopack is still in development
- It has issues with:
  - Paths containing spaces
  - Windows path handling
  - Some symlink structures

## After Fixing

Once you restart without Turbopack:
1. ✅ No more fatal errors
2. ✅ Server runs stable
3. ✅ Pages load correctly
4. ✅ MongoDB connection works

## Note

The standard webpack bundler is:
- ✅ More stable
- ✅ Better Windows support
- ✅ Handles paths with spaces correctly
- ⚠️ Slightly slower than Turbopack (but still fast)

You can always switch back to Turbopack later when it's more stable, or when you move the project to a path without spaces.
