import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')
const nextConfig: NextConfig = {
  /* config options here */
  // Note: Turbopack has issues with paths containing spaces
  // If you see Turbopack crashes, use: next dev (without --turbo flag)
};
export default withNextIntl(nextConfig);
//export default nextConfig;
