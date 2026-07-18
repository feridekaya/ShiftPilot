'use client';

import { useState } from 'react';

export interface ZoneEmployee {
  id: number;
  name: string;
  status?: string; // pending | completed | approved | rejected
}

interface ZoneCardProps {
  label: string;
  employees: ZoneEmployee[];
  accent: string;
  className?: string;
  style?: React.CSSProperties;
  compact?: boolean;
}

const ACCENTS: Record<string, {
  border: string; darkBorder: string;
  labelColor: string;
  badgeBg: string; badgeText: string;
  darkBadgeBg: string; darkBadgeText: string;
  dot: string; activeBg: string; darkActiveBg: string;
}> = {
  amber:   { border: 'border-amber-200',   darkBorder: 'dark:border-amber-500/25',   labelColor: 'text-amber-600 dark:text-amber-400',   badgeBg: 'bg-amber-100',   badgeText: 'text-amber-800',   darkBadgeBg: 'dark:bg-amber-500/15',   darkBadgeText: 'dark:text-amber-100',   dot: 'bg-amber-400',   activeBg: 'bg-amber-50',   darkActiveBg: 'dark:bg-amber-500/10' },
  indigo:  { border: 'border-indigo-200',  darkBorder: 'dark:border-indigo-500/25',  labelColor: 'text-indigo-600 dark:text-indigo-400',  badgeBg: 'bg-indigo-100',  badgeText: 'text-indigo-800',  darkBadgeBg: 'dark:bg-indigo-500/15',  darkBadgeText: 'dark:text-indigo-100',  dot: 'bg-indigo-400',  activeBg: 'bg-indigo-50',  darkActiveBg: 'dark:bg-indigo-500/10' },
  emerald: { border: 'border-emerald-200', darkBorder: 'dark:border-emerald-500/25', labelColor: 'text-emerald-600 dark:text-emerald-400', badgeBg: 'bg-emerald-100', badgeText: 'text-emerald-800', darkBadgeBg: 'dark:bg-emerald-500/15', darkBadgeText: 'dark:text-emerald-100', dot: 'bg-emerald-400', activeBg: 'bg-emerald-50', darkActiveBg: 'dark:bg-emerald-500/10' },
  violet:  { border: 'border-violet-200',  darkBorder: 'dark:border-violet-500/25',  labelColor: 'text-violet-600 dark:text-violet-400',  badgeBg: 'bg-violet-100',  badgeText: 'text-violet-800',  darkBadgeBg: 'dark:bg-violet-500/15',  darkBadgeText: 'dark:text-violet-100',  dot: 'bg-violet-400',  activeBg: 'bg-violet-50',  darkActiveBg: 'dark:bg-violet-500/10' },
  rose:    { border: 'border-rose-200',    darkBorder: 'dark:border-rose-500/25',    labelColor: 'text-rose-600 dark:text-rose-400',    badgeBg: 'bg-rose-100',    badgeText: 'text-rose-800',    darkBadgeBg: 'dark:bg-rose-500/15',    darkBadgeText: 'dark:text-rose-100',    dot: 'bg-rose-400',    activeBg: 'bg-rose-50',    darkActiveBg: 'dark:bg-rose-500/10' },
  cyan:    { border: 'border-cyan-200',    darkBorder: 'dark:border-cyan-500/25',    labelColor: 'text-cyan-600 dark:text-cyan-400',    badgeBg: 'bg-cyan-100',    badgeText: 'text-cyan-800',    darkBadgeBg: 'dark:bg-cyan-500/15',    darkBadgeText: 'dark:text-cyan-100',    dot: 'bg-cyan-400',    activeBg: 'bg-cyan-50',    darkActiveBg: 'dark:bg-cyan-500/10' },
  slate:   { border: 'border-slate-200',   darkBorder: 'dark:border-slate-500/25',   labelColor: 'text-slate-600 dark:text-slate-400',   badgeBg: 'bg-slate-100',   badgeText: 'text-slate-700',   darkBadgeBg: 'dark:bg-slate-500/15',   darkBadgeText: 'dark:text-slate-200',   dot: 'bg-slate-400',   activeBg: 'bg-slate-50',   darkActiveBg: 'dark:bg-slate-500/10' },
  teal:    { border: 'border-teal-200',    darkBorder: 'dark:border-teal-500/25',    labelColor: 'text-teal-600 dark:text-teal-400',    badgeBg: 'bg-teal-100',    badgeText: 'text-teal-800',    darkBadgeBg: 'dark:bg-teal-500/15',    darkBadgeText: 'dark:text-teal-100',    dot: 'bg-teal-400',    activeBg: 'bg-teal-50',    darkActiveBg: 'dark:bg-teal-500/10' },
  orange:  { border: 'border-orange-200',  darkBorder: 'dark:border-orange-500/25',  labelColor: 'text-orange-600 dark:text-orange-400',  badgeBg: 'bg-orange-100',  badgeText: 'text-orange-800',  darkBadgeBg: 'dark:bg-orange-500/15',  darkBadgeText: 'dark:text-orange-100',  dot: 'bg-orange-400',  activeBg: 'bg-orange-50',  darkActiveBg: 'dark:bg-orange-500/10' },
};

const STATUS_STYLE: Record<string, string> = {
  approved:  'ring-1 ring-green-400 opacity-60',
  rejected:  'ring-1 ring-red-400 opacity-70',
  completed: 'ring-1 ring-blue-300 opacity-80',
};

export default function ZoneCard({ label, employees, accent, className = '', style, compact = false }: ZoneCardProps) {
  const [hovered, setHovered] = useState(false);
  const c = ACCENTS[accent] ?? ACCENTS.slate;

  return (
    <div
      style={style}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`
        relative overflow-hidden rounded-xl border transition-all duration-200 cursor-pointer
        bg-white dark:bg-[#111E38] backdrop-blur-sm flex flex-col justify-between
        ${c.border} ${c.darkBorder}
        ${hovered ? `${c.activeBg} ${c.darkActiveBg} shadow-lg scale-[1.012]` : 'shadow-sm'}
        ${compact ? 'p-3' : 'p-4'}
        ${className}
      `}
    >
      <div>
        {/* Zone name */}
        <p className={`text-xs font-black uppercase tracking-widest mb-3 ${c.labelColor}`}>
          {label}
        </p>

        {/* Employees */}
        <div className="flex flex-col gap-1.5">
          {employees.length === 0 ? (
            <span className="text-gray-400 dark:text-slate-700 text-xs italic">Boş</span>
          ) : (
            employees.map(e => (
              <span
                key={e.id}
                className={`
                  text-sm font-bold px-2.5 py-1 rounded-lg w-fit leading-tight
                  ${c.badgeBg} ${c.badgeText} ${c.darkBadgeBg} ${c.darkBadgeText}
                  ${e.status ? STATUS_STYLE[e.status] ?? '' : ''}
                  transition-all duration-150
                `}
              >
                {e.name}
                {e.status === 'approved' && <span className="ml-1 text-[10px]">✓</span>}
                {e.status === 'rejected'  && <span className="ml-1 text-[10px]">✕</span>}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Corner dot */}
      <div className={`absolute bottom-3 right-3 w-2 h-2 rounded-full ${c.dot} transition-opacity duration-200 ${hovered ? 'opacity-80' : 'opacity-20'}`} />
    </div>
  );
}
