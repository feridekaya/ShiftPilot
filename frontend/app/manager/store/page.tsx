'use client';

import { useEffect, useState } from 'react';
import { Assignment } from '@/types';
import * as assignmentService from '@/services/assignments';
import FloorLayout, { ZoneData } from '@/components/store/FloorLayout';
import Spinner from '@/components/ui/Spinner';

// ── Zone name → floor plan key mapping ─────────────────────────────────────
const ZONE_KEY_MAP: Record<string, string> = {
  'arka': 'arka',
  'wc kadın': 'wck', 'kadın wc': 'wck', 'bayan wc': 'wck', 'kadin wc': 'wck', 'wc kadin': 'wck',
  'wc erkek': 'wce', 'erkek wc': 'wce', 'bay wc': 'wce',
  'wc önü': 'wconu', 'wcönü': 'wconu', 'wc onu': 'wconu', 'wc onü': 'wconu',
  'orta': 'orta',
  'giriş': 'giris', 'giris': 'giris', 'giris bölge': 'giris',
  'yan dükkan': 'yan', 'yan dukkan': 'yan', 'yan': 'yan',
  'kabile kafa': 'kabile', 'kabile': 'kabile',
  'sakin salon': 'sakin', 'sakin': 'sakin',
};

function resolveZoneKey(name: string): string | null {
  return ZONE_KEY_MAP[name.toLowerCase().trim()] ?? null;
}

// ── Shift name → section key ────────────────────────────────────────────────
function resolveSectionKey(shiftName: string): 'opening' | 'shift' | 'closing' {
  const n = shiftName.toLowerCase();
  if (n.includes('sabah') || n.includes('açılış') || n.includes('acilis') || n.includes('opening')) return 'opening';
  if (n.includes('akşam') || n.includes('aksam') || n.includes('kapanış') || n.includes('kapanis') || n.includes('closing')) return 'closing';
  return 'shift';
}

function buildZoneData(assignments: Assignment[]): ZoneData {
  const map: ZoneData = {};
  for (const a of assignments) {
    if (!a.zone) continue;
    const key = resolveZoneKey(a.zone.name);
    if (!key) continue;
    if (!map[key]) map[key] = [];
    if (!map[key].find(e => e.id === a.user.id)) {
      map[key].push({ id: a.user.id, name: a.user.name });
    }
  }
  return map;
}

// ── Section config ───────────────────────────────────────────────────────────
const SECTIONS = [
  {
    key: 'opening',
    label: 'Açılış',
    sublabel: 'Opening',
    dot: 'bg-amber-400',
    ring: 'ring-amber-500/20',
    gradient: 'from-amber-500/5 to-transparent',
    countColor: 'text-amber-500',
  },
  {
    key: 'shift',
    label: 'Vardiya',
    sublabel: 'Shift',
    dot: 'bg-indigo-400',
    ring: 'ring-indigo-500/20',
    gradient: 'from-indigo-500/5 to-transparent',
    countColor: 'text-indigo-400',
  },
  {
    key: 'closing',
    label: 'Kapanış',
    sublabel: 'Closing',
    dot: 'bg-rose-400',
    ring: 'ring-rose-500/20',
    gradient: 'from-rose-500/5 to-transparent',
    countColor: 'text-rose-400',
  },
] as const;

// ── Page ─────────────────────────────────────────────────────────────────────
export default function StorePage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [businessDate, setBusinessDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [all, dateInfo] = await Promise.all([
        assignmentService.getAssignments(),
        assignmentService.getBusinessDate(),
      ]);
      setBusinessDate(dateInfo.business_date);
      setAssignments(all.filter(a => a.date === dateInfo.business_date));
      setLoading(false);
    }
    load();
  }, []);

  // Group assignments into sections
  const sectionMap: Record<string, Assignment[]> = { opening: [], shift: [], closing: [] };
  for (const a of assignments) {
    const key = a.shift ? resolveSectionKey(a.shift.name) : 'shift';
    sectionMap[key].push(a);
  }

  const totalStaff = new Set(assignments.map(a => a.user.id)).size;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-slate-950 -m-6">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 -m-6 px-4 py-6 md:px-8 md:py-8">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <p className="text-slate-600 text-xs uppercase tracking-widest mb-1">Yerleşim Planı</p>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Dükkan</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <p className="text-slate-500 text-xs">İş günü</p>
            <p className="text-white font-mono font-bold text-sm">{businessDate}</p>
          </div>
          <div className="w-px h-8 bg-slate-800" />
          <div className="flex flex-col items-end">
            <p className="text-slate-500 text-xs">Toplam personel</p>
            <p className="text-white font-bold text-sm">{totalStaff} kişi</p>
          </div>
        </div>
      </div>

      {/* ── Section tabs (mobile) ── */}
      <div className="flex md:hidden gap-2 mb-6 overflow-x-auto pb-1">
        {SECTIONS.map(s => (
          <button
            key={s.key}
            onClick={() => setActiveSection(activeSection === s.key ? null : s.key)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap
              border transition-all duration-150
              ${activeSection === s.key || activeSection === null
                ? `bg-slate-800 border-slate-700 text-white`
                : 'bg-transparent border-slate-800 text-slate-600'}
            `}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {s.label}
            <span className={`${s.countColor} font-mono`}>
              {new Set(sectionMap[s.key].map(a => a.user.id)).size}
            </span>
          </button>
        ))}
      </div>

      {/* ── Sections ── */}
      <div className="flex flex-col gap-12">
        {SECTIONS.map((section, idx) => {
          const sectionAssignments = sectionMap[section.key];
          const zoneData = buildZoneData(sectionAssignments);
          const staffCount = new Set(sectionAssignments.map(a => a.user.id)).size;
          const isVisible = activeSection === null || activeSection === section.key;

          if (!isVisible) return null;

          return (
            <div
              key={section.key}
              className="opacity-0"
              style={{
                animation: 'sectionFadeIn 0.35s ease forwards',
                animationDelay: `${idx * 80}ms`,
              }}
            >
              {/* Section header */}
              <div className="flex items-center gap-3 mb-5">
                <div className={`flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 ring-2 ${section.ring}`}>
                  <div className={`w-2 h-2 rounded-full ${section.dot}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-white font-bold text-lg leading-none">{section.label}</h2>
                    <span className="text-slate-600 text-xs">{section.sublabel}</span>
                  </div>
                  <p className={`text-xs mt-0.5 ${section.countColor}`}>
                    {staffCount > 0 ? `${staffCount} personel aktif` : 'Personel atanmadı'}
                  </p>
                </div>
                {/* Divider line */}
                <div className="flex-1 h-px bg-gradient-to-r from-slate-800 to-transparent hidden md:block" />
              </div>

              {/* Floor plan */}
              <div className={`rounded-2xl p-3 md:p-4 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/60`}>
                {/* Compass-like label */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-slate-700 text-[9px] uppercase tracking-widest font-bold">← Mutfak</span>
                  <span className="text-slate-700 text-[9px] uppercase tracking-widest font-bold">Cadde →</span>
                </div>
                <FloorLayout data={zoneData} />
                <div className="flex justify-center mt-3">
                  <span className="text-slate-700 text-[9px] uppercase tracking-widest font-bold">↓ Çıkış</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Legend ── */}
      <div className="mt-12 pt-6 border-t border-slate-800/60 flex flex-wrap gap-x-6 gap-y-2">
        {[
          { color: 'bg-amber-400', label: 'Arka (Mutfak)' },
          { color: 'bg-indigo-400', label: 'Orta (Ana salon)' },
          { color: 'bg-emerald-400', label: 'Giriş' },
          { color: 'bg-violet-400', label: 'Yan Dükkan' },
          { color: 'bg-rose-400', label: 'Kabile Kafa' },
          { color: 'bg-cyan-400', label: 'Sakin Salon' },
          { color: 'bg-slate-400', label: 'WC Alanları' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${item.color}`} />
            <span className="text-slate-600 text-[10px]">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
