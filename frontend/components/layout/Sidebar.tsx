'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarLink {
  href: string;
  label: string;
}

interface SidebarProps {
  links: SidebarLink[];
  isOpen?: boolean;
  onClose?: () => void;
}

function NavLinks({ links, pathname, onClose }: { links: SidebarLink[]; pathname: string; onClose?: () => void }) {
  return (
    <>
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClose}
            className={`px-4 py-2.5 text-sm rounded-md mx-2 transition-colors ${
              active ? 'bg-indigo-600 text-white' : 'hover:bg-[#1a3a6b] text-slate-300'
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </>
  );
}

export default function Sidebar({ links, isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  useEffect(() => {
    onClose?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <>
      {/* Desktop sidebar — always visible */}
      <aside className="hidden md:flex w-52 bg-[#0e2549] text-gray-300 flex-col py-6 gap-1 shrink-0">
        <NavLinks links={links} pathname={pathname} />
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <aside className="w-64 bg-[#0e2549] text-gray-300 flex flex-col py-4 gap-1">
            <div className="flex items-center justify-between px-4 mb-2">
              <span className="text-white font-bold text-base">Menü</span>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white p-1 rounded"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <NavLinks links={links} pathname={pathname} onClose={onClose} />
          </aside>
          {/* Backdrop */}
          <div className="flex-1 bg-black/50" onClick={onClose} />
        </div>
      )}
    </>
  );
}
