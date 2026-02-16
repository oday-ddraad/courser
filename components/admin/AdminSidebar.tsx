'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FolderTree,
  GraduationCap,
  MessageSquare,
  CreditCard,
  Settings,
  Mail,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Video
} from 'lucide-react';


interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  permission?: string;
}

export default function AdminSidebar() {
  const t = useTranslations('Dashboard.admin.sidebar');
  const locale = useLocale();
  const pathname = usePathname();
  const isRTL = locale === 'ar';
  const [collapsed, setCollapsed] = useState(true); // Start collapsed by default
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: NavItem[] = [
    {
      href: `/${locale}/dashboard/admin`,
      label: t('dashboard'),
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      href: `/${locale}/dashboard/admin/users`,
      label: t('users'),
      icon: <Users className="w-5 h-5" />,
      permission: 'user.manage',
    },
    {
      href: `/${locale}/dashboard/admin/courses`,
      label: t('courses'),
      icon: <BookOpen className="w-5 h-5" />,
      permission: 'course.manage',
    },
    {
      href: `/${locale}/dashboard/admin/categories`,
      label: t('categories'),
      icon: <FolderTree className="w-5 h-5" />,
      permission: 'course.manage',
    },
    {
      href: `/${locale}/dashboard/admin/instructors`,
      label: t('instructors'),
      icon: <GraduationCap className="w-5 h-5" />,
      permission: 'user.manage',
    },
    {
      href: `/${locale}/dashboard/admin/messages`,
      label: t('messages'),
      icon: <MessageSquare className="w-5 h-5" />,
      permission: 'notification.send',
    },
    {
      href: `/${locale}/dashboard/admin/payments`,
      label: t('payments'),
      icon: <CreditCard className="w-5 h-5" />,
      permission: 'payment.manage',
    },
    {
      href: `/${locale}/dashboard/admin/settings`,
      label: t('settings'),
      icon: <Settings className="w-5 h-5" />,
    },
    {
      href: `/${locale}/dashboard/admin/jaas-test`,
      label: 'JaaS Test',
      icon: <Video className="w-5 h-5" />,
    },
  ];


  const isActive = (href: string) => {
    if (href === `/${locale}/dashboard/admin`) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <div className={`flex flex-col h-full bg-slate-900 text-white transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
      {/* Header */}
      <div className={`flex items-center p-4 border-b border-slate-700 ${isRTL ? 'flex-row-reverse' : 'justify-between'}`}>
        {!collapsed && (
          <Link href={`/${locale}/dashboard/admin`} className="text-xl font-bold text-white">
            {t('adminPanel')}
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`p-1 rounded-lg hover:bg-slate-700 transition hidden md:block ${isRTL && collapsed ? 'mr-auto' : ''} ${!isRTL && collapsed ? 'ml-auto' : ''}`}
          title={collapsed ? t('expand') : t('collapse')}
        >
          {isRTL ? (
            collapsed ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />
          ) : (
            collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${isRTL ? 'flex-row-reverse' : ''} ${
                    active
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  {item.icon}
                  {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700">
        <Link
          href={`/${locale}/dashboard`}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition ${collapsed ? 'justify-center' : ''} ${isRTL ? 'flex-row-reverse' : ''}`}
          title={collapsed ? t('backToDashboard') : undefined}
        >
          {isRTL ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          {!collapsed && <span className="text-sm font-medium">{t('backToDashboard')}</span>}
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className={`fixed top-20 z-[70] p-2 bg-slate-900 text-white rounded-lg md:hidden ${isRTL ? 'right-4' : 'left-4'}`}
      >

        {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[60] md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - Mobile */}
      <div
        className={`fixed inset-y-0 z-[70] transform transition-transform duration-300 md:hidden ${isRTL ? 'right-0' : 'left-0'} ${
          mobileOpen ? 'translate-x-0' : isRTL ? 'translate-x-full' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </div>


      {/* Sidebar - Desktop */}
      <div className="hidden md:block h-full flex-shrink-0">
        {sidebarContent}
      </div>
    </>
  );
}
