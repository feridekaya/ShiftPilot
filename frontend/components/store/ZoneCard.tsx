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
  amber:   { border: 'border-amber-500/25',   glow: 'shadow-amber-500/20',   labelColor: 'text-amber-400',   badgeBg: 'bg-amber-500/15',   badgeText: 'text-amber-200',   dot: 'bg-amber-400',   activeBg: 'bg-amber-500/10' },
  indigo:  { border: 'border-indigo-500/25',  glow: 'shadow-indigo-500/20',  labelColor: 'text-indigo-400',  badgeBg: 'bg-indigo-500/15',  badgeText: 'text-indigo-200',  dot: 'bg-indigo-400',  activeBg: 'bg-indigo-500/10' },
  emerald: { border: 'border-emerald-500/25', glow: 'shadow-emerald-500/20', labelColor: 'text-emerald-400', badgeBg: 'bg-emerald-500/15', badgeText: 'text-emerald-200', dot: 'bg-emerald-400', activeBg: 'bg-emerald-500/10' },
  violet:  { border: 'border-violet-500/25',  glow: 'shadow-violet-500/20',  labelColor: 'text-violet-400',  badgeBg: 'bg-violet-500/15',  badgeText: 'text-violet-200',  dot: 'bg-violet-400',  activeBg: 'bg-violet-500/10' },
  rose:    { border: 'border-rose-500/25',    glow: 'shadow-rose-500/20',    labelColor: 'text-rose-400',    badgeBg: 'bg-rose-500/15',    badgeText: 'text-rose-200',    dot: 'bg-rose-400',    activeBg: 'bg-rose-500/10' },
  cyan:    { border: 'border-cyan-500/25',    glow: 'shadow-cyan-500/20',    labelColor: 'text-cyan-400',    badgeBg: 'bg-cyan-500/15',    badgeText: 'text-cyan-200',    dot: 'bg-cyan-400',    activeBg: 'bg-cyan-500/10' },
  slate:   { border: 'border-slate-500/25',   glow: 'shadow-slate-500/10',   labelColor: 'text-slate-400',   badgeBg: 'bg-slate-500/15',   badgeText: 'text-slate-300',   dot: 'bg-slate-400',   activeBg: 'bg-slate-500/10' },
  teal:    { border: 'border-teal-500/25',    glow: 'shadow-teal-500/20',    labelColor: 'text-teal-400',    badgeBg: 'bg-teal-500/15',    badgeText: 'text-teal-200',    dot: 'bg-teal-400',    activeBg: 'bg-teal-500/10' },
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
        bg-slate-900/70 backdrop-blur-sm
        ${c.border}
        ${hovered ? `${c.activeBg} shadow-lg ${c.glow} scale-[1.015]` : 'shadow-sm'}
        ${compact ? 'p-2.5 min-h-[56px]' : 'p-3.5 min-h-[72px]'}
        ${className}
      `}
    >
      {/* Top-left accent line */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] rounded-t-xl transition-opacity duration-200 ${c.dot.replace('bg-', 'bg-')} ${hovered ? 'opacity-80' : 'opacity-20'}`}
        style={{ background: `linear-gradient(90deg, transparent, currentColor, transparent)` }}
      />

      {/* Zone name */}
      <p className={`text-[9px] font-black uppercase tracking-[0.18em] mb-2 ${c.labelColor} transition-all duration-200`}>
        {label}
      </p>

      {/* Employees */}
      <div className="flex flex-col gap-1">
        {employees.length === 0 ? (
          <span className="text-slate-700 text-[10px] italic">Boş</span>
        ) : (
          employees.map(e => (
            <span
              key={e.id}
              className={`
                text-[11px] font-semibold px-2 py-0.5 rounded-full w-fit leading-tight
                ${c.badgeBg} ${c.badgeText}
                transition-all duration-150
              `}
            >
              {e.name}
            </span>
          ))
        )}
      </div>

      {/* Corner indicator */}
      <div className={`absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full ${c.dot} transition-opacity duration-200 ${hovered ? 'opacity-70' : 'opacity-15'}`} />
    </div>
  );
}
