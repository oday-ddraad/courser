"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link'; 
import { usePathname, useRouter, useSelectedLayoutSegment } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';

const Navbar = ({ locale }: { locale: string }) => {
  const t = useTranslations('Navbar');
  const [isOpen, setIsOpen] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  const pathname = usePathname();
  const router = useRouter();
  
  // This detects the current sub-page (e.g., 'courses')
  const segment = useSelectedLayoutSegment();

  useEffect(() => setMounted(true), []);

  const switchLanguage = (newLocale: string) => {
    const pathWithoutLocale = pathname.replace(`/${locale}`, '');
    const newPath = `/${newLocale}${pathWithoutLocale === '' ? '/' : pathWithoutLocale}`;
    router.push(newPath);
  };

  return (
    <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200 dark:border-slate-800 transition-all duration-300">
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
        
        {/* LOGO */}
        <Link href={`/${locale}`} className="flex items-center space-x-3 rtl:space-x-reverse group">
          <div className="w-10 h-10 bg-blue-600 dark:bg-blue-500 rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform">
             <span className="text-white font-bold text-xl">M</span>
          </div>
          <span className="self-center text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            MYAPP
          </span>
        </Link>

        {/* BUTTONS & CONTROLS */}
        <div className="flex md:order-2 space-x-2 rtl:space-x-reverse items-center">
          
          {/* Language Select */}
          <select 
            onChange={(e) => switchLanguage(e.target.value)}
            value={locale}
            className="bg-transparent text-gray-900 text-sm rounded-lg p-1 dark:text-white cursor-pointer focus:ring-0 outline-none"
          >
            <option value="en">EN</option>
            <option value="de">DE</option>
            <option value="ar">AR</option>
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

          {/* Desktop Auth Buttons (Explicitly styled to ensure they show) */}
          <div className="hidden md:flex items-center space-x-2 rtl:space-x-reverse">
            <button className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 transition-colors">
              {t('login')}
            </button>
            <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 active:scale-95 transition-all">
              {t('signup')}
            </button>
          </div>

          {/* Mobile Menu Btn */}
          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 text-gray-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isOpen ? "M6 18L18 6" : "M4 6h16M4 12h16m-7 6h7"} />
            </svg>
          </button>
        </div>

        {/* NAVIGATION LINKS */}
        <div className={`${isOpen ? 'block' : 'hidden'} w-full md:flex md:w-auto md:order-1`}>
          <ul className="flex flex-col p-4 md:p-0 mt-4 border rounded-lg md:flex-row md:space-x-8 rtl:space-x-reverse md:mt-0 md:border-0 dark:bg-slate-900 md:dark:bg-transparent">
          <NavLink href={`#courses`} label={t('courses')} active={segment === 'courses'} />
          <NavLink href={`#prices`} label={t('prices')} active={segment === 'prices'} />
          <NavLink href={`#contact`} label={t('contact')} active={segment === 'contact'} />
            
            {/* Mobile-only Auth Buttons */}
            <li className="md:hidden pt-4 mt-4 border-t border-gray-200 dark:border-gray-700 flex flex-col space-y-2">
               <button className="w-full py-2 text-gray-700 dark:text-gray-200">{t('login')}</button>
               <button className="w-full py-2 bg-blue-600 text-white rounded-lg">{t('signup')}</button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

// NavLink with Animation and Active State
const NavLink = ({ href, label, active }: { href: string; label: string, active: boolean }) => (
  <li className="relative group">
    <Link 
      href={href} 
      className={`block py-2 px-1 text-sm font-medium transition-colors duration-300 ${
        active 
        ? "text-blue-600 dark:text-blue-400" 
        : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
      }`}
    >
      {label}
      {/* Animated Underline */}
      <span className={`absolute bottom-0 left-0 h-0.5 bg-blue-600 transition-all duration-300 ${
        active ? "w-full" : "w-0 group-hover:w-full"
      }`}></span>
    </Link>
  </li>
);

export default Navbar;