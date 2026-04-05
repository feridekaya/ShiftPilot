import { TaskCategory } from '@/types';

export const CATEGORY_LABEL: Record<TaskCategory, string> = {
  opening:        'Açılış',
  closing:        'Kapanış',
  responsibility: 'Sorumluluk Bölgesi',
  general:        'Genel',
  special:        'Özel',
};

export const CATEGORY_BORDER: Record<TaskCategory, string> = {
  opening:        'border-l-4 border-amber-400',
  closing:        'border-l-4 border-purple-400',
  responsibility: 'border-l-4 border-blue-400',
  general:        'border-l-4 border-gray-300',
  special:        'border-l-4 border-rose-400',
};

export const CATEGORY_BADGE: Record<TaskCategory, string> = {
  opening:        'bg-amber-100 text-amber-800',
  closing:        'bg-purple-100 text-purple-800',
  responsibility: 'bg-blue-100 text-blue-800',
  general:        'bg-gray-100 text-gray-600',
  special:        'bg-rose-100 text-rose-800',
};
