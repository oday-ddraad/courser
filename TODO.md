# Fix Internationalization Issues

## Information Gathered
- The app uses next-intl for i18n with locales: en, ar, de.
- Translation files (messages/*.json) are partially complete; some keys missing in ar.json and de.json.
- Navbar component uses useTranslations('Navbar') but missing 'dashboard' and 'logout' keys in ar.json and de.json.
- Landing page (app/[locale]/page.tsx) has hardcoded h1 text instead of using translations.
- Language switcher in Navbar may cause URL mixing (e.g., /en/ar) due to incorrect path replacement.
- Dashboard pages use useTranslations but translations may be incomplete, causing text to appear in English.
- All relevant components (Navbar, auth forms, error pages, dashboards) use useTranslations or getTranslations.

## Plan
1. **Complete translation files**
   - Add missing 'dashboard' and 'logout' to Navbar in ar.json and de.json.
   - Add full 'Errors' and 'Auth' sections to ar.json and de.json.
   - Add 'journeyTitle' to Hero section in all translation files.

2. **Fix landing page**
   - Replace hardcoded h1 in app/[locale]/page.tsx with t('Hero.journeyTitle').

3. **Fix language switcher**
   - Update switchLanguage function in components/Navbar.tsx to use router.replace(`/${newLocale}${pathname}`) for correct URL handling.

4. **Verify dashboard translations**
   - Ensure all dashboard pages (admin, user, instructor) have complete translations; add any missing keys if needed.

## Dependent Files to Edit
- messages/ar.json
- messages/de.json
- messages/en.json
- app/[locale]/page.tsx
- components/Navbar.tsx
- (Possibly app/[locale]/dashboard/instructor/page.tsx if translations missing)

## Followup Steps
- Test language switching: Change locale via navbar select and verify navbar items, landing page content, and URLs update correctly without mixing (e.g., no /en/ar).
- Verify all pages load in all 3 locales with correct translations (landing, login, register, dashboards).
- Check for any remaining hardcoded text or missing translations.
