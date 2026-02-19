"use client";

import { useState, useEffect, useRef } from 'react';
import { Link, useRouter, usePathname } from '@/i18n/routing'; // Use localized routing
import { useSelectedLayoutSegment } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { useSession, signOut } from 'next-auth/react'; // Add NextAuth hooks
import NotificationBell from './notifications/NotificationBell';
import { User, ChevronDown, LogOut, LayoutDashboard, UserCircle, Mail, RefreshCw, X } from 'lucide-react';




const Navbar = ({ locale }: { locale: string }) => {
  const t = useTranslations('Navbar');
  const { data: session, status } = useSession(); // Access user session
  const [isOpen, setIsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showEmailInfo, setShowEmailInfo] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  const pathname = usePathname();
  const router = useRouter();
  const segment = useSelectedLayoutSegment();
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    if (isOpen || userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, userMenuOpen]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);


  // Use the router.replace to switch languages while keeping the current path
  const switchLanguage = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (session?.user?.name) {
      return session.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return 'U';
  };

  // Check if email is not verified (but not for Google users since Google already verifies emails)
  const showEmailVerificationWarning = status === "authenticated" && !session?.user?.emailVerified && session?.user?.provider !== 'google';


  const handleResendEmail = async () => {
    setResendingEmail(true);
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session?.user?.email, locale }),
      });
      const data = await response.json();
      if (data.success) {
        setShowEmailInfo(true);
      } else {
        console.error('Failed to resend email:', data.error);
      }
    } catch (error) {
      console.error('Failed to resend email:', error);
    } finally {
      setResendingEmail(false);
    }
  };


  return (
    <>
      {/* Email Verification Warning Banner */}
      {showEmailVerificationWarning && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 px-4 py-2">
          <div className="max-w-screen-xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 text-sm text-amber-800 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 flex-shrink-0" />
              <span>{t('emailNotVerified') || 'Your email is not verified.'}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEmailInfo(!showEmailInfo)}
                className="font-semibold underline hover:text-amber-900 dark:hover:text-amber-100"
              >
                {t('verifyNow') || 'Verify now'}
              </button>
              <span>{t('toEnroll') || 'to enroll in courses.'}</span>
              <button
                onClick={handleResendEmail}
                disabled={resendingEmail}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-amber-100 dark:bg-amber-800/50 hover:bg-amber-200 dark:hover:bg-amber-700/50 rounded transition-colors disabled:opacity-50"
                title={t('resendEmail') || 'Resend verification email'}
              >
                <RefreshCw className={`w-3 h-3 ${resendingEmail ? 'animate-spin' : ''}`} />
                {resendingEmail ? t('sending') || 'Sending...' : t('resend') || 'Resend'}
              </button>
            </div>
          </div>
          
          {/* Email Info Dropdown */}
          {showEmailInfo && (
            <div className="max-w-screen-xl mx-auto mt-2 px-4">
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-amber-200 dark:border-amber-700 p-4 max-w-md mx-auto relative">
                <button
                  onClick={() => setShowEmailInfo(false)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-4 h-4" />
                </button>
                <p className="text-sm text-gray-700 dark:text-gray-300 text-center">
                  {t('emailWillArrive') || 'A verification email will arrive in your mailbox shortly. Please check your inbox and spam folder.'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      
      <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200 dark:border-slate-800 transition-all duration-300">

      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
        
        {/* LOGO */}
        <Link href="/" className="flex items-center space-x-3 rtl:space-x-reverse group">
          <div className="w-10 h-10 bg-blue-600 dark:bg-blue-500 rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform">
             <span className="text-white font-bold text-xl">N</span>
          </div>
          <span className="self-center text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            NEXAPATH
          </span>
        </Link>

        {/* BUTTONS & CONTROLS */}
        <div className="flex md:order-2 space-x-2 rtl:space-x-reverse items-center">
          
          {/* Language Select */}
          <select 
            onChange={(e) => switchLanguage(e.target.value)}
            value={locale}
            className="bg-transparent text-gray-900 text-sm rounded-lg p-1 dark:text-white cursor-pointer focus:ring-0 outline-none font-medium"
          >
            <option value="en" className="dark:bg-slate-900">EN</option>
            <option value="de" className="dark:bg-slate-900">DE</option>
            <option value="ar" className="dark:bg-slate-900">AR</option>
          </select>

          {/* Theme Toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              {resolvedTheme === "dark" ? "☀️" : "🌙"}
            </button>
          )}

          {/* Notification Bell */}
          {status === "authenticated" && <NotificationBell />}

          {/* Dynamic Auth Buttons */}
          <div className="hidden md:flex items-center space-x-2 rtl:space-x-reverse">
            {status === "authenticated" ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center overflow-hidden">
                    {session?.user?.avatar ? (
                      <img 
                        src={session.user.avatar} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-sm font-medium">{getUserInitials()}</span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200 max-w-[100px] truncate">
                    {session?.user?.name || 'User'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* User Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {session?.user?.name || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {session?.user?.email || ''}
                      </p>
                    </div>
                    
                    <Link 
                      href="/profile" 
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <UserCircle className="w-4 h-4" />
                      View Profile
                    </Link>
                    
                    <Link 
                      href="/dashboard" 
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      {t('dashboard')}
                    </Link>
                    
                    <div className="border-t border-gray-200 dark:border-slate-700 mt-2 pt-2">
                      <button 
                        onClick={() => {
                          setUserMenuOpen(false);
                          signOut({ callbackUrl: '/' });
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        {t('logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login" className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 transition-colors">
                  {t('login')}
                </Link>
                <Link href="/register" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 active:scale-95 transition-all">
                  {t('signup')}
                </Link>
              </>
            )}
          </div>

        {/* Mobile Menu Btn */}
        <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 text-gray-500 z-[80] relative">

            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isOpen ? "M6 18L18 6" : "M4 6h16M4 12h16m-7 6h7"} />
            </svg>
          </button>
        </div>


        {/* NAVIGATION LINKS */}
        <div ref={mobileMenuRef} className={`${isOpen ? 'block' : 'hidden'} w-full md:flex md:w-auto md:order-1 z-[80] relative`}>
          <ul className="flex flex-col p-4 md:p-0 mt-4 border rounded-lg md:flex-row md:space-x-8 rtl:space-x-reverse md:mt-0 md:border-0 dark:bg-slate-900 md:dark:bg-transparent bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm shadow-lg">
            <NavLink href="/courses" label={t('courses')} active={segment === 'courses'} onClick={() => setIsOpen(false)} />
            <NavLink href="/#prices" label={t('prices')} active={segment === 'prices'} onClick={() => setIsOpen(false)} />
            <NavLink href="/#contact" label={t('contact')} active={segment === 'contact'} onClick={() => setIsOpen(false)} />


            
            {/* Mobile-only Auth Buttons */}
            <li className="md:hidden pt-4 mt-4 border-t border-gray-200 dark:border-gray-700 flex flex-col space-y-2">
               {status === "authenticated" ? (
                 <>
                   <div className="flex items-center gap-3 px-2 py-2">
                     <div className="w-10 h-10 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center overflow-hidden">
                       {session?.user?.avatar ? (
                         <img 
                           src={session.user.avatar} 
                           alt="Profile" 
                           className="w-full h-full object-cover"
                         />
                       ) : (
                         <span className="text-white text-sm font-medium">{getUserInitials()}</span>
                       )}
                     </div>
                     <div className="flex-1 min-w-0">
                       <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                         {session?.user?.name || 'User'}
                       </p>
                       <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                         {session?.user?.email || ''}
                       </p>
                     </div>
                   </div>
                   <Link href="/profile" onClick={() => setIsOpen(false)} className="w-full py-2 text-center text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg flex items-center justify-center gap-2">
                     <UserCircle className="w-4 h-4" />
                     {t('viewProfile') || 'View Profile'}
                   </Link>
                   <Link href="/dashboard" onClick={() => setIsOpen(false)} className="w-full py-2 text-center bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2">
                     <LayoutDashboard className="w-4 h-4" />
                     {t('dashboard')}
                   </Link>
                   <button onClick={() => { setIsOpen(false); signOut(); }} className="w-full py-2 bg-red-500 text-white rounded-lg flex items-center justify-center gap-2">
                     <LogOut className="w-4 h-4" />
                     {t('logout')}
                   </button>
                 </>
               ) : (
                 <>
                   <Link href="/login" onClick={() => setIsOpen(false)} className="w-full py-2 text-center text-gray-700 dark:text-gray-200">{t('login')}</Link>
                   <Link href="/register" onClick={() => setIsOpen(false)} className="w-full py-2 text-center bg-blue-600 text-white rounded-lg">{t('signup')}</Link>
                 </>
               )}
            </li>


          </ul>
        </div>

      </div>
    </nav>
    </>
  );
};


const NavLink = ({ href, label, active, onClick }: { href: string; label: string, active: boolean, onClick?: () => void }) => (
  <li className="relative group">
    <Link 
      href={href} 
      onClick={onClick}
      className={`block py-2 px-1 text-sm font-medium transition-colors duration-300 ${
        active 
        ? "text-blue-600 dark:text-blue-400" 
        : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
      }`}
    >
      {label}
      <span className={`absolute bottom-0 left-0 h-0.5 bg-blue-600 transition-all duration-300 ${
        active ? "w-full" : "w-0 group-hover:w-full"
      }`}></span>
    </Link>
  </li>
);


export default Navbar;
