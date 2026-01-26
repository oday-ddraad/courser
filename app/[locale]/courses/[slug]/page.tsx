export async function generateMetadata({ params }: { params: { locale: string, slug: string } }) {
  // In a real app, you would fetch course data from your DB here
  // const course = await getCourse(slug);

  return {
    title: `Course: ${params.slug} | MyApp`,
    description: `Join our ${params.slug} language course today.`
  };
}