import SignupForm from "@/components/auth/SignupForm";

export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <main className="min-h-[80vh] flex items-center justify-center">
      <SignupForm locale={locale} />
    </main>
  );
}