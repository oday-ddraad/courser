import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth/config';
import { UserRole } from '@/types/database';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const role = session.user.role as UserRole;

  // Redirect to role-specific dashboard
  switch (role) {
    case 'admin':
      redirect('/dashboard/admin');
    case 'instructor':
      redirect('/dashboard/instructor');
    case 'user':
      redirect('/dashboard/user');
    default:
      redirect('/forbidden');
  }
}
