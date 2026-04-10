'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';

const employeeLinks = [
  { href: '/employee',             label: 'Görevlerim'   },
  { href: '/employee/store',       label: 'Dükkan'       },
  { href: '/employee/schedule',    label: 'Çizelge'      },
  { href: '/employee/breaks',      label: 'Mola'         },
  { href: '/employee/performance', label: 'Performansım' },
];

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) router.replace('/login');
    else if (user.role !== 'employee') router.replace('/dashboard');
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== 'employee') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar links={employeeLinks} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
