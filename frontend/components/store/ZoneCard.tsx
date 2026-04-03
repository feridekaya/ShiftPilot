'use client';

import { useState } from 'react';

export interface ZoneEmployee {
  id: number;
  name: string;
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
  border: string; glow: string; labelColor: string;
  badgeBg: string; badgeText: string; dot: string; activeBg: string;
}> = {
  amber:   { border: 'border-amber-500/25',   glow: 'shadow-amber-500/20',   labelColor: 'text-amber-400',   badgeBg: 'bg-amber-500/15',   badgeText: 'text-amber-100',   dot: 'bg-amber-400',   activeBg: 'bg-amber-500/10' },
  indigo:  { border: 'border-indigo-500/25',  glow: 'shadow-indigo-500/20',  labelColor: 'text-indigo-400',  badgeBg: 'bg-indigo-500/15',  badgeText: 'text-indigo-100',  dot: 'bg-indigo-400',  activeBg: 'bg-indigo-500/10' },
  emerald: { border: 'border-emerald-500/25', glow: 'shadow-emerald-500/20', labelColor: 'text-emerald-400', badgeBg: 'bg-emerald-500/15', badgeText: 'text-emerald-100', dot: 'bg-emerald-400', activeBg: 'bg-emerald-500/10' },
  violet:  { border: 'border-violet-500/25',  glow: 'shadow-violet-500/20',  labelColor: 'text-violet-400',  badgeBg: 'bg-violet-500/15',  badgeText: 'text-violet-100',  dot: 'bg-violet-400',  activeBg: 'bg-violet-500/10' },
  rose:    { border: 'border-rose-500/25',    glow: 'shadow-rose-500/20',    labelColor: 'text-rose-400',    badgeBg: 'bg-rose-500/15',    badgeText: 'text-rose-100',    dot: 'bg-rose-400',    activeBg: 'bg-rose-500/10' },
  cyan:    { border: 'border-cyan-500/25',    glow: 'shadow-cyan-500/20',    labelColor: 'text-cyan-400',    badgeBg: 'bg-cyan-500/15',    badgeText: 'text-cyan-100',    dot: 'bg-cyan-400',    activeBg: 'bg-cyan-500/10' },
  slate:   { border: 'border-slate-500/25',   glow: 'shadow-slate-500/10',   labelColor: 'text-slate-400',   badgeBg: 'bg-slate-500/15',   badgeText: 'text-slate-200',   dot: 'bg-slate-400',   activeBg: 'bg-slate-500/10' },
  teal:    { border: 'border-teal-500/25',    glow: 'shadow-teal-500/20',    labelColor: 'text-teal-400',    badgeBg: 'bg-teal-500/15',    badgeText: 'text-teal-100',    dot: 'bg-teal-400',    activeBg: 'bg-teal-500/10' },
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
        bg-slate-900/70 backdrop-blur-sm flex flex-col justify-between
        ${c.border}
        ${hovered ? `${c.activeBg} shadow-lg ${c.glow} scale-[1.012]` : 'shadow-sm'}
        ${compact ? 'p-3' : 'p-4'}
        ${className}
      `}
    >
      {/* Top accent bar */}
      <div
        className={`absolute top-0 left-0 right-0 h-[2.5px] rounded-t-xl transition-opacity duration-200 ${hovered ? 'opacity-90' : 'opacity-25'}`}
        style={{
          background: `linear-gradient(90deg, transparent 0%, var(--tw-gradient-stops))`,
        }}
      />

      <div>
        {/* Zone name */}
        <p className={`text-xs font-black uppercase tracking-widest mb-3 ${c.labelColor}`}>
          {label}
        </p>

        {/* Employees */}
        <div className="flex flex-col gap-1.5">
          {employees.length === 0 ? (
            <span className="text-slate-700 text-xs italic">Boş</span>
          ) : (
            employees.map(e => (
              <span
                key={e.id}
                className={`
                  text-sm font-bold px-2.5 py-1 rounded-lg w-fit leading-tight
                  ${c.badgeBg} ${c.badgeText}
                  transition-all duration-150
                `}
              >
                {e.name}
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
