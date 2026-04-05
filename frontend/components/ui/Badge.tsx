import { AssignmentStatus, ApprovalStatus } from '@/types';

const colors: Record<string, string> = {
  pending:    'bg-yellow-100 text-yellow-800',
  completed:  'bg-blue-100 text-blue-800',
  approved:   'bg-green-100 text-green-800',
  rejected:   'bg-red-100 text-red-800',
  manager:    'bg-indigo-100 text-indigo-800',
  supervisor: 'bg-violet-100 text-violet-800',
  employee:   'bg-slate-100 text-slate-700',
};

const labels: Record<string, string> = {
  pending:    'Bekliyor',
  completed:  'Tamamlandı',
  approved:   'Onaylandı',
  rejected:   'Reddedildi',
  manager:    'Yönetici',
  supervisor: 'Şef',
  employee:   'Personel',
};

export default function Badge({ status }: { status: AssignmentStatus | ApprovalStatus | string }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] ?? 'bg-gray-100 text-gray-700'}`}>
      {labels[status] ?? status}
    </span>
  );
}
