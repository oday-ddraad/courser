import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-src 'self' https://8x8.vc https://*.8x8.vc https://www.youtube.com https://youtube.com https://*.youtube.com https://www.youtube-nocookie.com https://youtube-nocookie.com https://*.youtube-nocookie.com;",
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
