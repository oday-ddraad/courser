# Quick Fix for Tailwind CSS Error

## The Problem
Next.js can't resolve `tailwindcss` because:
1. Your folder path has a space: `"nextjs template"` 
2. pnpm's symlink structure is causing path resolution issues

## Solution: Switch to npm (Recommended)

**pnpm is having persistent issues with your folder structure. Use npm instead:**

### Step 1: Clean pnpm files
```powershell
cd "C:\Users\ACcidBuRN\Desktop\nextjs template\courses-test"
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force pnpm-lock.yaml -ErrorAction SilentlyContinue
Remove-Item -Force .npmrc -ErrorAction SilentlyContinue
```

### Step 2: Install with npm
```powershell
npm install
```

### Step 3: Start dev server
```powershell
npm run dev
```

## Alternative: Fix pnpm (If you prefer pnpm)

If you want to keep using pnpm:

### Step 1: Clean install
```powershell
cd "C:\Users\ACcidBuRN\Desktop\nextjs template\courses-test"
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force pnpm-lock.yaml -ErrorAction SilentlyContinue
```

### Step 2: Create .npmrc file (I've already created this)
The `.npmrc` file I created will help with hoisting.

### Step 3: Reinstall
```powershell
pnpm install --shamefully-hoist
```

### Step 4: Start dev server
```powershell
pnpm dev
```

## Why npm is Better Here

- npm handles paths with spaces better
- No symlink issues
- More reliable on Windows
- Same functionality

## After Fixing

Once the server starts successfully:
1. Visit: http://localhost:3000
2. Test MongoDB: http://localhost:3000/api/test-db
