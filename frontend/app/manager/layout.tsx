'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';

const managerLinks = [
  { href: '/manager/store', label: 'Dükkan' },
  { href: '/manager/schedule', label: 'Çizelge' },
  { href: '/manager/users', label: 'Kullanıcılar' },
  { href: '/manager/tasks', label: 'Görevler' },
  { href: '/manager/zones', label: 'Bölgeler' },
  { href: '/manager/assignments', label: 'Atamalar' },
  { href: '/manager/breaks', label: 'Molalar' },
  { href: '/manager/announcements', label: 'Duyurular' },
  { href: '/manager/feedback',      label: 'Geri Bildirim' },
  { href: '/manager/performance', label: 'Performans' },
  { href: '/manager/audit',       label: 'Denetim'    },
  { href: '/manager/activity',    label: 'Etkinlik'   },
  { href: '/manager/trainings',  label: 'Eğitimler'  },
];

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!user) router.replace('/login');
    else if (user.role !== 'manager') router.replace('/dashboard');
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== 'manager') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar links={managerLinks} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar onMenuToggle={() => setSidebarOpen(o => !o)} />
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-50 dark:bg-[#0A1128] transition-colors duration-200">{children}</main>
      </div>
    </div>
  );
}
