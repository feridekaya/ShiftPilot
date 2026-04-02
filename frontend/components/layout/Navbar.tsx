'use client';

import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';

const roleLabel: Record<string, string> = {
  manager: 'Yönetici',
  supervisor: 'Süpervizör',
  employee: 'Çalışan',
};

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-white border-b shadow-sm">
      <span className="text-lg font-bold text-indigo-600">ShiftPilot</span>
      {user && (
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {user.name}{' '}
            <span className="ml-1 text-xs text-indigo-500 font-medium">
              [{roleLabel[user.role] ?? user.role}]
            </span>
          </span>
          <Button variant="secondary" size="sm" onClick={logout}>
            Çıkış
          </Button>
        </div>
      )}
    </header>
  );
}
