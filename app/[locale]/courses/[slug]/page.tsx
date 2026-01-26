import { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

// This is a named export (Correct)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Course: ${slug}`,
  };
}

// THIS IS WHAT WAS MISSING: You must use "export default" for the component
export default async function CoursePage({ params }: Props) {
  const { slug, locale } = await params;

  return (
    <div className="py-20">
      <h1 className="text-3xl font-bold">Course: {slug}</h1>
      <p>Language: {locale}</p>
    </div>
  );
}