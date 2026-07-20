'use client';

import { useEffect, useState, useCallback } from 'react';
import * as assignmentService from '@/services/assignments';
import * as evalSvc from '@/services/evaluations';
import { UserPerformance } from '@/services/assignments';
import { EvaluationSummary } from '@/types';
import Spinner from '@/components/ui/Spinner';
import { downloadExcel } from '@/lib/excel';

// ── Date helpers ──────────────────────────────────────────────────────────────
function toISO(d: Date) { return d.toLocaleDateString('en-CA'); }
function firstDayOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }

// ── Helpers ───────────────────────────────────────────────────────────────────
const ROLE_LABEL: Record<string, string> = { manager: 'Yönetici', supervisor: 'Şef', employee: 'Personel' };
const ROLE_ICON:  Record<string, string> = { manager: '👑', supervisor: '🎯', employee: '👤' };

function rateColor(val: number | null, invert = false) {
  if (val === null) return 'text-slate-400';
  const good = invert ? val <= 20 : val >= 80;
  const ok   = invert ? val <= 40 : val >= 60;
  if (good) return 'text-emerald-600 dark:text-emerald-400 font-semibold';
  if (ok)   return 'text-amber-600 dark:text-amber-400 font-semibold';
  return 'text-rose-600 dark:text-rose-400 font-semibold';
}

function scoreColor(v: number) {
  if (v >= 4.5) return 'text-emerald-600 dark:text-emerald-400 font-semibold';
  if (v >= 3)   return 'text-amber-600 dark:text-amber-400 font-semibold';
  if (v > 0)    return 'text-rose-600 dark:text-rose-400 font-semibold';
  return 'text-slate-300 dark:text-slate-600';
}

function pct(v: number | null) {
  return v === null ? <span className="text-slate-300 dark:text-slate-600">—</span> : `${v}%`;
}
function num(v: number | null, d = 0) {
  return v === null ? <span className="text-slate-300 dark:text-slate-600">—</span> : (d ? v.toFixed(d) : v);
}
function scoreCell(v: number) {
  return v > 0
    ? <span className={scoreColor(v)}>{v.toFixed(1)}</span>
    : <span className="text-slate-300 dark:text-slate-600">—</span>;
}

type SortKey = keyof UserPerformance;
type Tab = 'all' | 'workforce' | 'feedback' | 'evaluations';

const TABS: { key: Tab; label: string }[] = [
  { key: 'all',         label: 'Tümü'           },
  { key: 'workforce',   label: 'İş Gücü'        },
  { key: 'feedback',    label: 'Feedback'        },
  { key: 'evaluations', label: 'Değerlendirme'  },
];

const EVAL_COLS: { key: keyof EvaluationSummary; label: string }[] = [
  { key: 'avg_punctuality',       label: 'Dakiklik'        },
  { key: 'avg_break_compliance',  label: 'Mola Uyumu'      },
  { key: 'avg_customer_comm',     label: 'Müşteri İlet.'   },
  { key: 'avg_speed_agility',     label: 'Hız/Çeviklik'    },
  { key: 'avg_teamwork',          label: 'Takım'           },
  { key: 'avg_hygiene_uniform',   label: 'Hijyen/Ünif.'    },
  { key: 'avg_problem_solving',   label: 'Problem Çözme'   },
  { key: 'avg_feedback_openness', label: 'FB Açıklık'      },
  { key: 'avg_energy_motivation', label: 'Enerji/Mot.'     },
];

// ── Page ──────────────────────────────────────────────────────────────────────
export default function PerformancePage() {
  const today = new Date();
  const [dateFrom, setDateFrom] = useState(toISO(firstDayOfMonth(today)));
  const [dateTo,   setDateTo]   = useState(toISO(today));
  const [tab, setTab]           = useState<Tab>('all');

  const [data,     setData]     = useState<UserPerformance[]>([]);
  const [evalData, setEvalData] = useState<EvaluationSummary[]>([]);
  const [loading,  setLoading]  = useState(true);

  const [sortKey, setSortKey]   = useState<SortKey>('total_coefficient');
  const [sortDir, setSortDir]   = useState<'asc' | 'desc'>('desc');
  const [roleFilter, setRoleFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    const [rows, evals] = await Promise.all([
      assignmentService.getPerformance({ date_from: dateFrom, date_to: dateTo }),
      evalSvc.getEvaluationSummary({ date_from: dateFrom, date_to: dateTo }),
    ]);
    setData(rows);
    setEvalData(evals);
    setLoading(false);
  }, [dateFrom, dateTo]);

  useEffect(() => { load(); }, []);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  }

  const roles = ['all', 'manager', 'supervisor', 'employee'];
  const sorted = [...data]
    .filter(r => r.is_active !== false)
    .filter(r => roleFilter === 'all' || r.user_role === roleFilter)
    .sort((a, b) => {
      const av = a[sortKey] ?? -1, bv = b[sortKey] ?? -1;
      const cmp = typeof av === 'string'
        ? (av as string).localeCompare(bv as string, 'tr')
        : (av as number) - (bv as number);
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const totalCoeff  = data.reduce((s, r) => s + r.total_coefficient, 0);
  const totalAssign = data.reduce((s, r) => s + r.total_assignments, 0);
  const hasApproval = data.some(r => r.approval_rate !== null);
  const hasRedo     = data.some(r => r.redo_rate !== null);
  const avgApproval = hasApproval
    ? data.filter(r => r.approval_rate !== null).reduce((s, r) => s + (r.approval_rate ?? 0), 0) / data.filter(r => r.approval_rate !== null).length
    : null;
  const avgRedo = hasRedo
    ? data.filter(r => r.redo_rate !== null).reduce((s, r) => s + (r.redo_rate ?? 0), 0) / data.filter(r => r.redo_rate !== null).length
    : null;

  const totalFbPos = data.reduce((s, r) => s + r.feedback_positive, 0);
  const totalFbNeg = data.reduce((s, r) => s + r.feedback_negative, 0);
  const fbPosRate  = totalFbPos + totalFbNeg > 0 ? Math.round(totalFbPos / (totalFbPos + totalFbNeg) * 100) : null;

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <span className="text-slate-300 ml-0.5 text-[10px]">↕</span>;
    return <span className="text-indigo-500 ml-0.5 text-[10px]">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  }
  function Th({ label, k, right }: { label: string; k: SortKey; right?: boolean }) {
    return (
      <th
        className={`px-3 py-3 text-xs uppercase tracking-wider cursor-pointer select-none whitespace-nowrap hover:text-slate-900 dark:hover:text-slate-100 ${right ? 'text-right' : 'text-left'}`}
        onClick={() => handleSort(k)}
      >
        {label}<SortIcon k={k} />
      </th>
    );
  }

  function handleExport() {
    const rows = sorted.map(r => ({
      'İsim': r.user_name,
      'Rol': ROLE_LABEL[r.user_role] ?? r.user_role,
      'Toplam Atama': r.total_assignments,
      'Tamamlanan': r.completed,
      'Onaylanan': r.approved,
      'Reddedilen': r.rejected,
      'Bekleyen': r.pending,
      'Toplam Katsayı': r.total_coefficient,
      'Tamamlanma %': r.completion_rate ?? '',
      'Onay %': r.approval_rate ?? '',
      'Tekrar %': r.redo_rate ?? '',
      'Ort. Deneme': r.avg_submissions_per_task ?? '',
      'FB Olumlu': r.feedback_positive,
      'FB Olumsuz': r.feedback_negative,
      'FB Olumlu %': r.feedback_pos_rate ?? '',
    }));
    downloadExcel([{ name: 'Performans', rows }], `performans_${dateFrom}_${dateTo}`);
  }

  const showWorkforce   = tab === 'all' || tab === 'workforce';
  const showFeedback    = tab === 'all' || tab === 'feedback';
  const showEvaluations = tab === 'all' || tab === 'evaluations';

  const TABLE_HEAD = 'bg-slate-50 dark:bg-[#162543] text-slate-600 dark:text-slate-300';
  const TABLE_WRAP = 'bg-white dark:bg-[#111E38] rounded-xl shadow border border-slate-100 dark:border-[#1E293B] overflow-x-auto';
  const ROW_EVEN   = 'bg-white dark:bg-[#111E38] hover:bg-slate-50 dark:hover:bg-[#192d4a] text-slate-800 dark:text-slate-200';
  const ROW_ODD    = 'bg-slate-50 dark:bg-[#0A1128] hover:bg-slate-100 dark:hover:bg-[#192d4a] text-slate-800 dark:text-slate-200';

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Performans</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Personel bazlı istatistikler</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="border border-slate-300 dark:border-[#1E293B] bg-white dark:bg-[#111E38] text-slate-900 dark:text-white rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          <span className="text-slate-400 text-sm">—</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="border border-slate-300 dark:border-[#1E293B] bg-white dark:bg-[#111E38] text-slate-900 dark:text-white rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          <button onClick={load}
            className="bg-indigo-600 text-white text-sm font-medium px-4 py-1.5 rounded-md hover:bg-indigo-700 transition-colors">
            Uygula
          </button>
          <button onClick={handleExport} disabled={data.length === 0}
            className="bg-white dark:bg-[#111E38] border border-slate-300 dark:border-[#1E293B] text-slate-600 dark:text-slate-300 text-sm font-medium px-4 py-1.5 rounded-md hover:bg-slate-50 dark:hover:bg-[#192d4a] transition-colors disabled:opacity-40">
            ⬇ Excel
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="overflow-x-auto w-full pb-0.5">
        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-[#111E38] rounded-xl w-fit min-w-full sm:min-w-0 border border-slate-200 dark:border-[#1E293B]">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                tab === t.key
                  ? 'bg-white dark:bg-[#1E3A8A] text-indigo-700 dark:text-indigo-200 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center mt-20"><Spinner size="lg" /></div>
      ) : (
        <>
          {/* ══════════════════════════════════════════════
              BÖLÜM 1 — İş Gücü
          ══════════════════════════════════════════════ */}
          {showWorkforce && (
            <section className="space-y-4">
              {tab === 'all' && (
                <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-[#1E293B] pb-2">
                  İş Gücü
                </h2>
              )}

              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <SummaryCard label="Toplam Atama"   value={String(totalAssign)} sub="görev"                         color="indigo"  />
                <SummaryCard label="Toplam Katsayı" value={totalCoeff.toFixed(1)} sub="iş yükü"                    color="violet"  />
                <SummaryCard label="Ort. Onay Oranı"
                  value={avgApproval !== null ? `${avgApproval.toFixed(1)}%` : '—'} sub="onaylanan / değerlendirilen" color="emerald" />
                <SummaryCard label="Ort. Tekrar Oranı"
                  value={avgRedo !== null ? `${avgRedo.toFixed(1)}%` : '—'} sub="reddeden gelen atamalar"             color="rose"    />
              </div>

              {/* Role filter */}
              <div className="flex gap-2 flex-wrap">
                {roles.map(r => (
                  <button key={r} onClick={() => setRoleFilter(r)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      roleFilter === r
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white dark:bg-[#111E38] text-slate-600 dark:text-slate-300 border-slate-300 dark:border-[#1E293B] hover:bg-slate-50 dark:hover:bg-[#192d4a]'
                    }`}>
                    {r === 'all' ? 'Tümü' : `${ROLE_ICON[r]} ${ROLE_LABEL[r]}`}
                  </button>
                ))}
                <span className="ml-auto text-xs text-slate-400 self-center">{sorted.length} kişi</span>
              </div>

              {/* Workforce table */}
              <div className={TABLE_WRAP}>
                <table className="min-w-full text-sm border-collapse">
                  <thead className={TABLE_HEAD}>
                    <tr>
                      <Th label="Personel"      k="user_name" />
                      <Th label="Rol"           k="user_role" />
                      <Th label="Atama"         k="total_assignments"        right />
                      <Th label="Tamamlanan"    k="completed"                right />
                      <Th label="Onaylanan"     k="approved"                 right />
                      <Th label="Reddedilen"    k="rejected"                 right />
                      <Th label="Bekleyen"      k="pending"                  right />
                      <Th label="Katsayı"       k="total_coefficient"        right />
                      <Th label="Tamamlanma %"  k="completion_rate"          right />
                      <Th label="Onay %"        k="approval_rate"            right />
                      <Th label="Tekrar %"      k="redo_rate"                right />
                      <Th label="Ort. Deneme"   k="avg_submissions_per_task" right />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#1E293B]">
                    {sorted.map((row, i) => (
                      <tr key={row.user_id} className={i % 2 === 0 ? ROW_EVEN : ROW_ODD}>
                        <td className="px-3 py-3 font-medium whitespace-nowrap">{ROLE_ICON[row.user_role]} {row.user_name}</td>
                        <td className="px-3 py-3 text-xs text-slate-500 dark:text-slate-400">{ROLE_LABEL[row.user_role] ?? row.user_role}</td>
                        <td className="px-3 py-3 text-right font-mono">{row.total_assignments}</td>
                        <td className="px-3 py-3 text-right font-mono">{row.completed}</td>
                        <td className="px-3 py-3 text-right font-mono text-emerald-700 dark:text-emerald-400">{row.approved}</td>
                        <td className="px-3 py-3 text-right font-mono text-rose-600 dark:text-rose-400">{row.rejected}</td>
                        <td className="px-3 py-3 text-right font-mono text-amber-600 dark:text-amber-400">{row.pending}</td>
                        <td className="px-3 py-3 text-right font-mono font-semibold">{row.total_coefficient.toFixed(1)}</td>
                        <td className={`px-3 py-3 text-right ${rateColor(row.completion_rate)}`}>{pct(row.completion_rate)}</td>
                        <td className={`px-3 py-3 text-right ${rateColor(row.approval_rate)}`}>{pct(row.approval_rate)}</td>
                        <td className={`px-3 py-3 text-right ${rateColor(row.redo_rate, true)}`}>{pct(row.redo_rate)}</td>
                        <td className="px-3 py-3 text-right font-mono text-slate-500 dark:text-slate-400">{num(row.avg_submissions_per_task, 2)}</td>
                      </tr>
                    ))}
                    {sorted.length === 0 && (
                      <tr><td colSpan={12} className="text-center py-10 text-slate-400">Bu dönemde veri bulunamadı.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                <span><span className="text-emerald-600 font-semibold">Yeşil</span> ≥ %80 iyi</span>
                <span><span className="text-amber-600 font-semibold">Sarı</span> ≥ %60 orta</span>
                <span><span className="text-rose-600 font-semibold">Kırmızı</span> &lt; %60 düşük</span>
                <span className="text-slate-400">Tekrar % için düşük değer iyidir</span>
              </div>
            </section>
          )}

          {/* ══════════════════════════════════════════════
              BÖLÜM 2 — Feedback Yönetimi
          ══════════════════════════════════════════════ */}
          {showFeedback && (
            <section className="space-y-4">
              {tab === 'all' && (
                <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-[#1E293B] pb-2">
                  Feedback Yönetimi
                </h2>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <SummaryCard label="Olumlu Feedback"  value={String(totalFbPos)} sub="onaylanan personel bildirimi" color="emerald" />
                <SummaryCard label="Olumsuz Feedback" value={String(totalFbNeg)} sub="reddedilen / sorunlu"         color="rose"    />
                <SummaryCard label="Olumlu Oranı"
                  value={fbPosRate !== null ? `${fbPosRate}%` : '—'} sub="olumlu / toplam"                         color="indigo"  />
              </div>

              <div className={TABLE_WRAP}>
                <table className="min-w-full text-sm border-collapse">
                  <thead className={TABLE_HEAD}>
                    <tr>
                      <th className="px-3 py-3 text-xs uppercase tracking-wider text-left">Personel</th>
                      <th className="px-3 py-3 text-xs uppercase tracking-wider text-left">Rol</th>
                      <th className="px-3 py-3 text-xs uppercase tracking-wider text-right">Olumlu</th>
                      <th className="px-3 py-3 text-xs uppercase tracking-wider text-right">Olumsuz</th>
                      <th className="px-3 py-3 text-xs uppercase tracking-wider text-right">Olumlu %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#1E293B]">
                    {sorted.filter(r => r.feedback_positive + r.feedback_negative > 0).map((row, i) => (
                      <tr key={row.user_id} className={i % 2 === 0 ? ROW_EVEN : ROW_ODD}>
                        <td className="px-3 py-3 font-medium whitespace-nowrap">{ROLE_ICON[row.user_role]} {row.user_name}</td>
                        <td className="px-3 py-3 text-xs text-slate-500 dark:text-slate-400">{ROLE_LABEL[row.user_role] ?? row.user_role}</td>
                        <td className="px-3 py-3 text-right font-mono text-emerald-700 dark:text-emerald-400">{row.feedback_positive}</td>
                        <td className="px-3 py-3 text-right font-mono text-rose-600 dark:text-rose-400">{row.feedback_negative}</td>
                        <td className={`px-3 py-3 text-right ${rateColor(row.feedback_pos_rate)}`}>{pct(row.feedback_pos_rate)}</td>
                      </tr>
                    ))}
                    {sorted.filter(r => r.feedback_positive + r.feedback_negative > 0).length === 0 && (
                      <tr><td colSpan={5} className="text-center py-10 text-slate-400">Bu dönemde feedback verisi yok.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ══════════════════════════════════════════════
              BÖLÜM 3 — Personel Değerlendirme
          ══════════════════════════════════════════════ */}
          {showEvaluations && (
            <section className="space-y-4">
              {tab === 'all' && (
                <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-[#1E293B] pb-2">
                  Personel Değerlendirme
                </h2>
              )}

              {evalData.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <SummaryCard label="Değerlendirilen" value={String(evalData.length)} sub="farklı personel" color="indigo" />
                  <SummaryCard label="Toplam Değerlendirme"
                    value={String(evalData.reduce((s, r) => s + r.eval_count, 0))} sub="gün × personel" color="violet" />
                  <SummaryCard label="Genel Ortalama"
                    value={(evalData.reduce((s, r) => s + r.avg_total, 0) / evalData.length).toFixed(2)}
                    sub="/ 5.00 puan" color="emerald" />
                </div>
              )}

              <div className={TABLE_WRAP}>
                <table className="min-w-full text-sm border-collapse">
                  <thead className={TABLE_HEAD}>
                    <tr>
                      <th className="px-3 py-3 text-xs uppercase tracking-wider text-left whitespace-nowrap">Personel</th>
                      <th className="px-3 py-3 text-xs uppercase tracking-wider text-right whitespace-nowrap">Değ. Sayısı</th>
                      <th className="px-3 py-3 text-xs uppercase tracking-wider text-right whitespace-nowrap">Genel Ort.</th>
                      {EVAL_COLS.map(c => (
                        <th key={c.key} className="px-3 py-3 text-xs uppercase tracking-wider text-right whitespace-nowrap">{c.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#1E293B]">
                    {evalData.map((row, i) => (
                      <tr key={row.employee_id} className={i % 2 === 0 ? ROW_EVEN : ROW_ODD}>
                        <td className="px-3 py-3 font-medium whitespace-nowrap">👤 {row.employee_name}</td>
                        <td className="px-3 py-3 text-right font-mono text-slate-500 dark:text-slate-400">{row.eval_count}</td>
                        <td className={`px-3 py-3 text-right font-mono font-bold ${scoreColor(row.avg_total)}`}>{row.avg_total.toFixed(2)}</td>
                        {EVAL_COLS.map(c => (
                          <td key={c.key} className="px-3 py-3 text-right font-mono">
                            {scoreCell(row[c.key] as number)}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {evalData.length === 0 && (
                      <tr><td colSpan={13} className="text-center py-10 text-slate-400">Bu dönemde değerlendirme verisi yok.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {evalData.length > 0 && (
                <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                  <span><span className={scoreColor(5)}>Yeşil</span> ≥ 4.5 mükemmel</span>
                  <span><span className={scoreColor(3.5)}>Sarı</span> ≥ 3.0 orta</span>
                  <span><span className={scoreColor(1)}>Kırmızı</span> &lt; 3.0 geliştirilmeli</span>
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}

// ── Summary card ──────────────────────────────────────────────────────────────
function SummaryCard({ label, value, sub, color }: {
  label: string; value: string; sub: string; color: 'indigo' | 'violet' | 'emerald' | 'rose';
}) {
  const colors = {
    indigo:  'bg-indigo-50  dark:bg-indigo-900/30  border-indigo-100  dark:border-indigo-700/50  text-indigo-700  dark:text-indigo-300',
    violet:  'bg-violet-50  dark:bg-violet-900/30  border-violet-100  dark:border-violet-700/50  text-violet-700  dark:text-violet-300',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-700/50 text-emerald-700 dark:text-emerald-300',
    rose:    'bg-rose-50    dark:bg-rose-900/30    border-rose-100    dark:border-rose-700/50    text-rose-700    dark:text-rose-300',
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
      <p className="text-2xl font-black tracking-tight">{value}</p>
      <p className="text-xs opacity-60 mt-0.5">{sub}</p>
    </div>
  );
}
