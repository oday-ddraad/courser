import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Inter, Cairo } from "next/font/google"; // Import Cairo for Arabic
import Navbar from "@/components/Navbar"; 
import { ThemeProvider } from "@/components/ThemeProvider";
import "../globals.css"; // Note the .. since we moved down one folder

const inter = Inter({ subsets: ["latin"] });
const cairo = Cairo({ subsets: ["arabic"] }); // Arabic font

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = await params;

  // Ensure strict locale validation
  if (!['en', 'de', 'ar'].includes(locale)) {
    notFound();
  }

  // Fetch messages for the current locale
  const messages = await getMessages();

  // Determine direction
  const direction = locale === 'ar' ? 'rtl' : 'ltr';
  const fontClass = locale === 'ar' ? cairo.className : inter.className;

  return (
    <html lang={locale} dir={direction} suppressHydrationWarning>
      <body className={fontClass}>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider 
            attribute="class" 
            defaultTheme="system" 
            enableSystem
            disableTransitionOnChange
          >
            <Navbar locale={locale} />
            <main className="max-w-screen-xl mx-auto p-4">
              {children}
            </main>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}