'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';

const managerLinks = [
  { href: '/manager/users', label: 'Kullanıcılar' },
  { href: '/manager/tasks', label: 'Görevler' },
  { href: '/manager/zones', label: 'Bölgeler' },
  { href: '/manager/shifts', label: 'Vardiyalar' },
  { href: '/manager/assignments', label: 'Atamalar' },
];

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

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
      <Sidebar links={managerLinks} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
