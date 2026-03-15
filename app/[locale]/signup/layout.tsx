import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Account | NexaPath Academy',
  description: 'Create your account to start learning. Sign up with Google or email.',
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      {children}
    </div>
  );
}

