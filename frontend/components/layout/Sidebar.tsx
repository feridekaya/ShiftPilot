'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarLink {
  href: string;
  label: string;
}

export default function Sidebar({ links }: { links: SidebarLink[] }) {
  const pathname = usePathname();

  return (
    <aside className="w-52 bg-gray-900 text-gray-300 flex flex-col py-6 gap-1 shrink-0">
      {links.map((link) => {
        const active = pathname === link.href || pathname.startsWith(link.href + '/');
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`px-4 py-2.5 text-sm rounded-md mx-2 transition-colors ${
              active ? 'bg-indigo-600 text-white' : 'hover:bg-gray-700'
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </aside>
  );
}
