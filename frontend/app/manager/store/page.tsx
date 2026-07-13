'use client';

import { useEffect, useState } from 'react';
import { Assignment, Zone } from '@/types';
import * as assignmentService from '@/services/assignments';
import * as taskService from '@/services/tasks';
import * as feedbackService from '@/services/feedback';
import { FeedbackStats } from '@/services/feedback';
import FloorLayout, { ZoneData } from '@/components/store/FloorLayout';
import Spinner from '@/components/ui/Spinner';

function resolveSectionKey(a: Assignment): 'opening' | 'shift' | 'closing' {
  const category = (a.task as { category?: string }).category;
  if (category === 'opening') return 'opening';
  if (category === 'closing') return 'closing';
  return 'shift';
}

function buildZoneData(assignments: Assignment[]): ZoneData {
  const map: ZoneData = {};
  for (const a of assignments) {
    if (!a.zone) continue;
    if (!map[a.zone.id]) map[a.zone.id] = [];
    const existing = map[a.zone.id].find(e => e.id === a.user.id);
    if (!existing) {
      map[a.zone.id].push({ id: a.user.id, name: a.user.name, status: a.status });
    } else if (a.status !== 'pending') {
      existing.status = a.status; // prefer non-pending status for display
    }
  }
  return map;
}

const SECTIONS = [
  { key: 'opening', label: 'Açılış',  sublabel: 'Opening', dot: 'bg-amber-400', ring: 'ring-amber-500/20', countColor: 'text-amber-400' },
  { key: 'shift',   label: 'Sorumluluk Bölgesi', sublabel: 'Responsibility', dot: 'bg-indigo-400', ring: 'ring-indigo-500/20', countColor: 'text-indigo-400' },
  { key: 'closing', label: 'Kapanış', sublabel: 'Closing', dot: 'bg-rose-400',   ring: 'ring-rose-500/20',  countColor: 'text-rose-400'  },
] as const;

export default function StorePage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [businessDate, setBusinessDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [fbStats, setFbStats] = useState<FeedbackStats | null>(null);

  useEffect(() => {
    async function load() {
      const [all, dateInfo, zoneList, stats] = await Promise.all([
        assignmentService.getAssignments(),
        assignmentService.getBusinessDate(),
        taskService.getZones(),
        feedbackService.getFeedbackStats().catch(() => null),
      ]);
      setBusinessDate(dateInfo.business_date);
      setAssignments(all.filter(a => a.date === dateInfo.business_date));
      setZones(zoneList);
      setFbStats(stats);
      setLoading(false);
    }
    load();
  }, []);

  const sectionMap: Record<string, Assignment[]> = { opening: [], shift: [], closing: [] };
  for (const a of assignments) {
    sectionMap[resolveSectionKey(a)].push(a);
  }

  const totalStaff = new Set(assignments.map(a => a.user.id)).size;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-white dark:bg-slate-950 -m-6">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 -m-6 px-4 py-6 md:px-8 md:py-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <p className="text-gray-500 dark:text-slate-600 text-xs uppercase tracking-widest mb-1">Yerleşim Planı</p>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">Dükkan</h1>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          {/* Customer rating widget */}
          {fbStats && (
            <>
              <div className="flex flex-col items-end">
                <p className="text-gray-500 dark:text-slate-500 text-xs">Günlük müşteri puanı</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  <span className="text-gray-900 dark:text-white font-bold text-sm">
                    {fbStats.today.customer.avg !== null ? fbStats.today.customer.avg.toFixed(1) : '—'}
                  </span>
                  <span className="text-gray-400 dark:text-slate-500 text-xs">
                    / {fbStats.today.customer.count} değerlendirme
                  </span>
                </div>
              </div>
              <div className="w-px h-8 bg-gray-200 dark:bg-slate-800" />
            </>
          )}
          <div className="flex flex-col items-end">
            <p className="text-gray-500 dark:text-slate-500 text-xs">İş günü</p>
            <p className="text-gray-900 dark:text-white font-mono font-bold text-sm">{businessDate}</p>
          </div>
          <div className="w-px h-8 bg-gray-200 dark:bg-slate-800" />
          <div className="flex flex-col items-end">
            <p className="text-gray-500 dark:text-slate-500 text-xs">Toplam personel</p>
            <p className="text-gray-900 dark:text-white font-bold text-sm">{totalStaff} kişi</p>
          </div>
        </div>
      </div>

      {/* Section tabs (mobile) */}
      <div className="flex md:hidden gap-2 mb-6 overflow-x-auto pb-1">
        {SECTIONS.map(s => (
          <button
            key={s.key}
            onClick={() => setActiveSection(activeSection === s.key ? null : s.key)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all duration-150
              ${activeSection === s.key || activeSection === null
                ? 'bg-gray-800 dark:bg-slate-800 border-gray-700 dark:border-slate-700 text-white'
                : 'bg-transparent border-gray-300 dark:border-slate-800 text-gray-600 dark:text-slate-600'}
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

      {/* Sections */}
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
              style={{ animation: 'sectionFadeIn 0.35s ease forwards', animationDelay: `${idx * 80}ms` }}
            >
              {/* Section header */}
              <div className="flex items-center gap-3 mb-5">
                <div className={`flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-800 ring-2 ${section.ring}`}>
                  <div className={`w-2 h-2 rounded-full ${section.dot}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-gray-900 dark:text-white font-bold text-lg leading-none">{section.label}</h2>
                    <span className="text-gray-500 dark:text-slate-600 text-xs">{section.sublabel}</span>
                  </div>
                  <p className={`text-xs mt-0.5 ${section.countColor}`}>
                    {staffCount > 0 ? `${staffCount} personel aktif` : 'Personel atanmadı'}
                  </p>
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-gray-200 dark:from-slate-800 to-transparent hidden md:block" />
              </div>

              {/* Floor plan */}
              <div className="rounded-2xl p-3 md:p-5 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-slate-900 dark:to-slate-950 border border-gray-200 dark:border-slate-800/60">
                <FloorLayout zones={zones} data={zoneData} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
