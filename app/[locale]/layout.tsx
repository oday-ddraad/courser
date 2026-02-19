import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Inter, Cairo } from "next/font/google";
import { SpeedInsights } from '@vercel/speed-insights/next';
import Navbar from "@/components/Navbar"; 
import { ThemeProvider } from "@/components/ThemeProvider";
import AuthProvider from "@/components/providers/AuthProvider";
import EmailTemplateInit from "@/components/providers/EmailTemplateInit";
import AdminLayoutWrapper from "./AdminLayoutWrapper";
import "../globals.css";

const inter = Inter({ subsets: ["latin"] });
const cairo = Cairo({ subsets: ["arabic"] });

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!['en', 'de', 'ar'].includes(locale)) {
    notFound();
  }

  const messages = await getMessages();
  const direction = locale === 'ar' ? 'rtl' : 'ltr';
  const fontClass = locale === 'ar' ? cairo.className : inter.className;

  return (
    <html lang={locale} dir={direction} suppressHydrationWarning>
      <body className={fontClass}>
        {/* 2. Wrap everything in AuthProvider */}
        <AuthProvider> 
          <NextIntlClientProvider messages={messages}>
            <ThemeProvider 
              attribute="class" 
              defaultTheme="system" 
              enableSystem
              disableTransitionOnChange
            >
              <EmailTemplateInit />
              <Navbar locale={locale} />
              <AdminLayoutWrapper>
                <main className="w-full p-4">
                  {children}
                </main>
              </AdminLayoutWrapper>
            </ThemeProvider>
          </NextIntlClientProvider>
        </AuthProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
