'use client';

import { useSession } from 'next-auth/react';
import { useLocale } from 'next-intl';
import { hasPermission } from '@/lib/auth/permissions';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const locale = useLocale();
  
  // Check if user is admin
  const isAdmin = session && hasPermission(session.user.role, 'user.manage');
  const isRTL = locale === 'ar';

  // If not admin, just render children normally
  if (!isAdmin) {
    return <>{children}</>;
  }

  // For admin users, show sidebar across entire site
  return (
    <div className={`flex min-h-[calc(100vh-80px)] ${isRTL ? 'flex-row-reverse' : ''}`}>
      <AdminSidebar />
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
