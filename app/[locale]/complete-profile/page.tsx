import ProfileCompletionForm from "@/components/auth/ProfileCompletionForm";

export default async function CompleteProfilePage({ 
  params 
}: { 
  params: Promise<{ locale: string }> 
}) {
  const { locale } = await params;
  
  return (
    <main className="min-h-[80vh] flex items-center justify-center p-4">
      <ProfileCompletionForm locale={locale} />
    </main>
  );
}
