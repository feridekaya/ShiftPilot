'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';

const supervisorLinks = [
  { href: '/supervisor/my-tasks',    label: 'Görevlerim'       },
  { href: '/supervisor',             label: 'Onay Bekleyenler' },
  { href: '/supervisor/store',       label: 'Dükkan'           },
  { href: '/supervisor/schedule',    label: 'Çizelge'          },
  { href: '/supervisor/announcements', label: 'Duyurular'      },
  { href: '/supervisor/feedback',      label: 'Geri Bildirim'  },
  { href: '/supervisor/assignments', label: 'Atamalar'         },
  { href: '/supervisor/tasks',       label: 'Görevler'         },
  { href: '/supervisor/zones',       label: 'Bölgeler'         },
  { href: '/supervisor/breaks',      label: 'Molalar'          },
  { href: '/supervisor/trainings',   label: 'Eğitimler'        },
  { href: '/supervisor/evaluations', label: 'Değerlendirme'    },
];

export default function SupervisorLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      <Sidebar links={supervisorLinks} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar onMenuToggle={() => setSidebarOpen(o => !o)} />
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-50 dark:bg-[#0A1128] transition-colors duration-200">{children}</main>
      </div>
    </div>
  );
}
