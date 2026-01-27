# Fix pnpm/Tailwind CSS Path Issue

## Problem
pnpm is having issues with node_modules linking, specifically with Tailwind CSS paths.

## Solution: Clean Reinstall

Run these commands **in order** in your terminal:

### Step 1: Clean Everything
```powershell
cd "C:\Users\ACcidBuRN\Desktop\nextjs template\courses-test"

# Remove node_modules
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue

# Remove lock file
Remove-Item -Force pnpm-lock.yaml -ErrorAction SilentlyContinue

# Clear pnpm store cache (optional but recommended)
pnpm store prune
```

### Step 2: Fix pnpm Configuration
```powershell
# Set pnpm to use the correct store location
pnpm config set store-dir "C:\Users\ACcidBuRN\AppData\Local\pnpm\store" --global

# Or reset pnpm config
pnpm config delete store-dir
```

### Step 3: Reinstall Dependencies
```powershell
# Fresh install
pnpm install
```

### Step 4: If Still Having Issues - Use npm Instead

If pnpm continues to have issues, switch to npm:

```powershell
# Remove pnpm files
Remove-Item -Force pnpm-lock.yaml -ErrorAction SilentlyContinue

# Install with npm
npm install
```

## Alternative: Use npm (Recommended if pnpm keeps failing)

Since pnpm is having persistent issues, you can use npm instead:

1. **Delete pnpm files:**
   ```powershell
   Remove-Item -Force pnpm-lock.yaml -ErrorAction SilentlyContinue
   ```

2. **Install with npm:**
   ```powershell
   npm install
   ```

3. **Update package.json scripts** (if needed):
   - Change `pnpm dev` to `npm run dev`
   - Change `pnpm build` to `npm run build`

## Verify Installation

After installing, check if Tailwind CSS is properly installed:

```powershell
# Check if tailwindcss exists
Test-Path "node_modules\tailwindcss"

# Should return: True
```

## If Error Persists

If you still get the Tailwind CSS path error:

1. **Check your postcss.config.mjs** - Make sure it references Tailwind correctly
2. **Check your tailwind.config.ts** - Verify the configuration
3. **Try deleting .next folder:**
   ```powershell
   Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
   ```

Then restart your dev server:
```powershell
pnpm dev
# or
npm run dev
```
