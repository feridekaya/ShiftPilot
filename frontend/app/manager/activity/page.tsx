'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api';
import * as feedbackSvc from '@/services/feedback';
import * as breaksSvc from '@/services/breaks';
import { Feedback } from '@/types';
import { Break } from '@/services/breaks';

// ── Assignment log type ────────────────────────────────────────────────────────
type LogEntry = {
  id: number;
  created_at: string;
  action: string;
  actor_name: string;
  target_user_name: string;
  task_title: string;
  business_date: string | null;
  note: string;
};

// ── Unified timeline entry ─────────────────────────────────────────────────────
type UnifiedEntry = {
  key: string;
  ts: string;
  action: string;
  actor: string;
  target?: string;
  detail?: string;
  secondary?: string;
  note?: string;
};

// ── Style map ─────────────────────────────────────────────────────────────────
const ACTION_STYLES: Record<string, { label: string; dot: string; badge: string }> = {
  assigned:           { label: 'Atandı',                dot: 'bg-indigo-500',  badge: 'bg-indigo-900/40 text-indigo-300 border-indigo-800/40'    },
  bulk_assigned:      { label: 'Toplu Atama',           dot: 'bg-violet-500',  badge: 'bg-violet-900/40 text-violet-300 border-violet-800/40'    },
  reassigned:         { label: 'Yeniden Atandı',        dot: 'bg-amber-500',   badge: 'bg-amber-900/40 text-amber-300 border-amber-800/40'       },
  completed:          { label: 'Tamamlandı',            dot: 'bg-blue-500',    badge: 'bg-blue-900/40 text-blue-300 border-blue-800/40'          },
  approved:           { label: 'Onaylandı',             dot: 'bg-emerald-500', badge: 'bg-emerald-900/40 text-emerald-300 border-emerald-800/40' },
  rejected:           { label: 'Reddedildi',            dot: 'bg-red-500',     badge: 'bg-red-900/40 text-red-300 border-red-800/40'             },
  deleted:            { label: 'Silindi',               dot: 'bg-gray-500',    badge: 'bg-gray-800/60 text-gray-400 border-gray-700/40'          },
  feedback_created:   { label: 'Geri Bildirim',         dot: 'bg-pink-500',    badge: 'bg-pink-900/40 text-pink-300 border-pink-800/40'          },
  feedback_responded: { label: 'Yanıt Verildi',         dot: 'bg-teal-500',    badge: 'bg-teal-900/40 text-teal-300 border-teal-800/40'          },
  break_start:        { label: 'Mola Başladı',          dot: 'bg-orange-400',  badge: 'bg-orange-900/40 text-orange-300 border-orange-800/40'    },
  break_end:          { label: 'Mola Bitti',            dot: 'bg-slate-400',   badge: 'bg-slate-800/60 text-slate-300 border-slate-700/40'       },
};

const ASSIGNMENT_ACTIONS = ['assigned', 'bulk_assigned', 'reassigned', 'completed', 'approved', 'rejected', 'deleted'];

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function isoDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-CA');
}

function Description({ e }: { e: UnifiedEntry }) {
  const a = e.action;
  if (a === 'approved')      return <><span className="font-semibold">{e.actor}</span> → <span className="text-emerald-600 dark:text-emerald-400 font-medium">onayladı</span></>;
  if (a === 'rejected')      return <><span className="font-semibold">{e.actor}</span> → <span className="text-red-600 dark:text-red-400 font-medium">reddetti</span></>;
  if (a === 'completed')     return <><span className="font-semibold">{e.actor}</span> görevi <span className="text-blue-600 dark:text-blue-400 font-medium">tamamladı</span></>;
  if (a === 'assigned' || a === 'bulk_assigned') return <><span className="font-semibold">{e.actor}</span> → <span className="font-medium text-indigo-600 dark:text-indigo-400">{e.target}</span> kişisine atadı</>;
  if (a === 'reassigned')    return <><span className="font-semibold">{e.actor}</span> → <span className="font-medium text-amber-600 dark:text-amber-400">{e.target}</span> kişisini yeniden atadı</>;
  if (a === 'deleted')       return <><span className="font-semibold">{e.actor}</span> → <span className="font-medium">{e.target}</span> atamasını sildi</>;
  if (a === 'feedback_created') return (
    <><span className="font-semibold">{e.actor}</span> <span className="text-pink-600 dark:text-pink-400 font-medium">geri bildirim verdi</span>
    {e.detail && <span className="text-gray-500 dark:text-slate-400"> · {e.detail}</span>}</>
  );
  if (a === 'feedback_responded') return (
    <><span className="font-semibold">{e.actor}</span> geri bildirime{' '}
    <span className={e.secondary === 'positive' ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-red-600 dark:text-red-400 font-medium'}>
      {e.secondary === 'positive' ? 'olumlu' : 'olumsuz'}
    </span> yanıt verdi</>
  );
  if (a === 'break_start')   return <><span className="font-semibold">{e.actor}</span> <span className="text-orange-500 dark:text-orange-400 font-medium">{e.detail === 'lunch' ? 'öğle molası' : 'kısa mola'}</span> başlattı</>;
  if (a === 'break_end')     return <><span className="font-semibold">{e.actor}</span> molasını bitirdi{e.secondary && <span className="text-gray-400 dark:text-slate-500 text-xs"> ({e.secondary})</span>}</>;
  return <span className="font-semibold">{e.actor}</span>;
}

export default function ActivityPage() {
  const [entries, setEntries] = useState<UnifiedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [dateFilter, setDateFilter] = useState(new Date().toLocaleDateString('en-CA'));

  async function load() {
    setLoading(true);
    try {
      const fetchAssignment = !actionFilter || ASSIGNMENT_ACTIONS.includes(actionFilter);
      const fetchFeedback   = !actionFilter || ['feedback_created', 'feedback_responded'].includes(actionFilter);
      const fetchBreaks     = !actionFilter || ['break_start', 'break_end'].includes(actionFilter);

      const assignParams: Record<string, string> = {};
      if (actionFilter && ASSIGNMENT_ACTIONS.includes(actionFilter)) assignParams.action = actionFilter;
      if (dateFilter) assignParams.business_date = dateFilter;

      const [assignRes, feedbacks, breaks] = await Promise.all([
        fetchAssignment ? api.get<LogEntry[]>('/api/assignments/activity/', { params: assignParams }) : Promise.resolve({ data: [] as LogEntry[] }),
        fetchFeedback   ? feedbackSvc.getFeedbacks()                                                 : Promise.resolve([] as Feedback[]),
        fetchBreaks     ? breaksSvc.getBreaks({ date: dateFilter })                                  : Promise.resolve([] as Break[]),
      ]);

      const unified: UnifiedEntry[] = [];

      // Assignment logs
      for (const log of assignRes.data) {
        unified.push({
          key: `a-${log.id}`,
          ts: log.created_at,
          action: log.action,
          actor: log.actor_name,
          target: log.target_user_name,
          detail: log.task_title,
          secondary: log.business_date ?? undefined,
          note: log.note || undefined,
        });
      }

      // Feedback logs
      for (const fb of feedbacks) {
        if (dateFilter && isoDate(fb.created_at) !== dateFilter) continue;
        unified.push({
          key: `fb-${fb.id}`,
          ts: fb.created_at,
          action: 'feedback_created',
          actor: fb.is_anonymous ? 'Anonim' : fb.user_name,
          detail: fb.category_display,
          secondary: fb.content.length > 70 ? fb.content.slice(0, 70) + '…' : fb.content,
        });
        if (fb.responded_at && fb.responded_by_name) {
          if (!dateFilter || isoDate(fb.responded_at) === dateFilter) {
            unified.push({
              key: `fbr-${fb.id}`,
              ts: fb.responded_at,
              action: 'feedback_responded',
              actor: fb.responded_by_name,
              detail: fb.category_display,
              secondary: fb.response ?? undefined,
              note: fb.response_note || undefined,
            });
          }
        }
      }

      // Break logs
      for (const br of breaks) {
        unified.push({
          key: `brs-${br.id}`,
          ts: br.started_at,
          action: 'break_start',
          actor: br.user_name,
          detail: br.break_type,
        });
        if (br.ended_at) {
          unified.push({
            key: `bre-${br.id}`,
            ts: br.ended_at,
            action: 'break_end',
            actor: br.user_name,
            detail: br.break_type,
            secondary: `${br.duration_minutes} dk`,
          });
        }
      }

      unified.sort((a, b) => b.ts.localeCompare(a.ts));
      setEntries(unified);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [actionFilter, dateFilter]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <p className="text-gray-500 dark:text-slate-500 text-xs uppercase tracking-widest mb-1">Yönetim</p>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Etkinlik Günlüğü</h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Tüm uygulama hareketleri — atamalar, geri bildirimler, molalar</p>
      </div>

      {/* Filtreler */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-[#1E293B] bg-white dark:bg-[#111E38] text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Tüm eylemler</option>
          <optgroup label="── Görev">
            <option value="assigned">Atandı</option>
            <option value="bulk_assigned">Toplu Atama</option>
            <option value="completed">Tamamlandı</option>
            <option value="approved">Onaylandı</option>
            <option value="rejected">Reddedildi</option>
            <option value="deleted">Silindi</option>
          </optgroup>
          <optgroup label="── Geri Bildirim">
            <option value="feedback_created">Geri Bildirim Verildi</option>
            <option value="feedback_responded">Geri Bildirim Yanıtlandı</option>
          </optgroup>
          <optgroup label="── Mola">
            <option value="break_start">Mola Başladı</option>
            <option value="break_end">Mola Bitti</option>
          </optgroup>
        </select>

        <input
          type="date"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-[#1E293B] bg-white dark:bg-[#111E38] text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        {(actionFilter || dateFilter) && (
          <button
            onClick={() => { setActionFilter(''); setDateFilter(''); }}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-[#1E293B] text-gray-500 dark:text-slate-400 text-sm hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Filtreyi Temizle
          </button>
        )}

        <button
          onClick={load}
          className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700 transition-colors"
        >
          ↺ Yenile
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-slate-500">
          Etkinlik kaydı bulunamadı.
        </div>
      ) : (
        <div className="relative">
          {/* Dikey çizgi */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200 dark:bg-[#1E293B]" />

          <div className="flex flex-col gap-1">
            {entries.map(entry => {
              const style = ACTION_STYLES[entry.action] ?? ACTION_STYLES.assigned;
              return (
                <div key={entry.key} className="relative pl-12 py-2">
                  <div className={`absolute left-2.5 top-4 w-3 h-3 rounded-full ${style.dot} ring-2 ring-white dark:ring-[#0A1128]`} />
                  <div className="bg-white dark:bg-[#111E38] border border-gray-100 dark:border-[#1E293B] rounded-xl px-4 py-3 hover:border-gray-300 dark:hover:border-slate-600 transition-colors">
                    <div className="flex flex-wrap items-start gap-2 mb-1">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${style.badge}`}>
                        {style.label}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-slate-500 ml-auto shrink-0">
                        {formatTime(entry.ts)}
                      </span>
                    </div>

                    <p className="text-sm text-gray-900 dark:text-white">
                      <Description e={entry} />
                    </p>

                    {/* Task detail for assignment actions */}
                    {ASSIGNMENT_ACTIONS.includes(entry.action) && entry.detail && (
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                        Görev: <span className="font-medium text-gray-700 dark:text-slate-300">{entry.detail}</span>
                        {entry.secondary && (
                          <span className="ml-2 text-gray-400 dark:text-slate-500">
                            {new Date(entry.secondary + 'T00:00:00').toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}
                          </span>
                        )}
                      </p>
                    )}

                    {/* Feedback content snippet */}
                    {entry.action === 'feedback_created' && entry.secondary && (
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 italic">{entry.secondary}</p>
                    )}

                    {/* Note */}
                    {entry.note && (
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 italic">
                        Not: {entry.note}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {entries.length > 0 && (
        <p className="text-[10px] text-gray-400 dark:text-slate-600 text-center mt-4">{entries.length} etkinlik</p>
      )}
    </div>
  );
}
