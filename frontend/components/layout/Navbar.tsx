'use client';

import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import Button from '@/components/ui/Button';

const roleLabel: Record<string, string> = {
  manager: 'Yönetici',
  supervisor: 'Şef',
  employee: 'Personel',
};

export default function Navbar({ onMenuToggle }: { onMenuToggle?: () => void }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-white dark:bg-[#0e2549] border-b border-gray-200 dark:border-[#1a3a6b] shadow-sm transition-colors duration-200">
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="md:hidden text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white p-1 rounded"
            aria-label="Menü"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <Image
          src={theme === 'dark' ? '/logos/logo-dark.png' : '/logos/logo-light.png'}
          alt="ShiftPilot"
          width={120}
          height={40}
          className="h-10 w-auto object-contain"
          priority
        />
      </div>

      <div className="flex items-center gap-3">
        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a3a6b] transition-colors"
          aria-label="Tema değiştir"
        >
          {theme === 'dark' ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        {user && (
          <>
            <span className="text-sm text-gray-600 dark:text-gray-300 hidden sm:inline">
              {user.name}{' '}
              <span className="ml-1 text-xs text-indigo-500 font-medium">
                [{roleLabel[user.role] ?? user.role}]
              </span>
            </span>
            <Button variant="secondary" size="sm" onClick={logout}>
              Çıkış
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
