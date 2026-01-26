import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import ArticleSection from '@/components/ArticleSection';
import HeroSlideshow from '@/components/HeroSlideshow';

interface Props {
  params: Promise<{ locale: string }>;
}

/**
 * DYNAMIC METADATA: SEO Powerhouse
 * This runs on the server and generates localized tags for Google/Social Media
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  const baseUrl = "https://your-language-app.com"; // Replace with your domain

  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: {
        'en-US': `${baseUrl}/en`,
        'de-DE': `${baseUrl}/de`,
        'ar-SA': `${baseUrl}/ar`,
      },
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `${baseUrl}/${locale}`,
      siteName: "MyApp Languages",
      images: [{ url: '/images/og-main.png', width: 1200, height: 630 }],
      locale: locale === 'ar' ? 'ar_AR' : locale === 'de' ? 'de_DE' : 'en_US',
      type: 'website',
    },
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations('Articles');

  const sections = [
    { id: 'courses', key: 'courses' },
    { id: 'prices', key: 'prices' },
    { id: 'contact', key: 'contact' },
  ];

  // Schema.org Structured Data for Google Search
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": "MyApp Languages",
    "description": t('courses.desc'),
    "url": `https://your-language-app.com/${locale}`,
    "logo": "https://your-language-app.com/icon.png",
  };

  return (
    <>
      {/* 1. Technical SEO: Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="space-y-20 pb-20">
        {/* 2. Visual Header */}
        <header className="pt-6">
          <HeroSlideshow />
          <div className="mt-12 text-center px-4">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {/* This should also be localized in your JSON if you wish */}
              {locale === 'ar' ? 'رحلتك نحو الإتقان تبدأ هنا' : 
               locale === 'de' ? 'Ihre Reise zur Meisterschaft beginnt hier' : 
               'Your Journey to Mastery Begins Here'}
            </h1>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              {t('courses.desc')}
            </p>
          </div>
        </header>

        {/* 3. Localized Articles (Mapped for Scrolling) */}
        <main className="container mx-auto px-4 space-y-16">
          {sections.map((section) => (
            <ArticleSection
              key={section.id}
              id={section.id}
              title={t(`${section.key}.title`)}
              description={t(`${section.key}.desc`)}
              buttonText={t('cta')}
              image={`/images/${section.id}.png`}
            />
          ))}
        </main>
      </div>
    </>
  );
}