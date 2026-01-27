# How to Disable Turbopack

## Quick Fix

I've updated your `package.json` to disable Turbopack. You need to install `cross-env` first:

```powershell
pnpm add -D cross-env
```

Then restart:
```powershell
pnpm dev
```

## Alternative: Manual Method (Windows PowerShell)

If you don't want to install cross-env, you can manually set the environment variable:

```powershell
$env:NEXT_PRIVATE_SKIP_TURBO="1"; pnpm dev
```

## Why This is Needed

- Next.js 16.1.5 has Turbopack enabled by default
- Turbopack crashes with paths containing spaces on Windows
- The `--no-turbo` flag doesn't exist in this version
- Using environment variable `NEXT_PRIVATE_SKIP_TURBO=1` disables it

## After Installing cross-env

1. Run: `pnpm add -D cross-env`
2. Run: `pnpm dev`
3. Turbopack will be disabled
4. No more crashes!
