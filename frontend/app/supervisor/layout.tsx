'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';

const supervisorLinks = [
  { href: '/supervisor',             label: 'Onay Bekleyenler' },
  { href: '/supervisor/store',       label: 'Dükkan'           },
  { href: '/supervisor/schedule',    label: 'Çizelge'          },
  { href: '/supervisor/assignments', label: 'Atamalar'         },
  { href: '/supervisor/tasks',       label: 'Görevler'         },
  { href: '/supervisor/zones',       label: 'Bölgeler'         },
  { href: '/supervisor/breaks',      label: 'Molalar'          },
];

export default function SupervisorLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) router.replace('/login');
    else if (user.role !== 'supervisor') router.replace('/dashboard');
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== 'supervisor') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar links={supervisorLinks} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
