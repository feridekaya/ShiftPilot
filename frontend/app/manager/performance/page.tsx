'use client';

import { useEffect, useState } from 'react';
import * as assignmentService from '@/services/assignments';
import { UserPerformance } from '@/services/assignments';
import Spinner from '@/components/ui/Spinner';
import { downloadExcel } from '@/lib/excel';

// ── Date helpers ──────────────────────────────────────────────────────────────
function toISO(d: Date) {
  return d.toLocaleDateString('en-CA');
}

function firstDayOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

// ── Role labels ───────────────────────────────────────────────────────────────
const ROLE_LABEL: Record<string, string> = {
  manager: 'Yönetici',
  supervisor: 'Şef',
  employee: 'Personel',
};

const ROLE_ICON: Record<string, string> = {
  manager: '👑',
  supervisor: '🎯',
  employee: '👤',
};

// ── Score helpers ─────────────────────────────────────────────────────────────
function rateColor(val: number | null, invert = false): string {
  if (val === null) return 'text-gray-400';
  const good = invert ? val <= 20 : val >= 80;
  const ok = invert ? val <= 40 : val >= 60;
  if (good) return 'text-emerald-600 font-semibold';
  if (ok) return 'text-amber-600 font-semibold';
  return 'text-red-600 font-semibold';
}

function pct(val: number | null) {
  if (val === null) return <span className="text-gray-300">—</span>;
  return `${val}%`;
}

function num(val: number | null, decimals = 0) {
  if (val === null) return <span className="text-gray-300">—</span>;
  return decimals ? val.toFixed(decimals) : val;
}

// ── Sort ──────────────────────────────────────────────────────────────────────
type SortKey = keyof UserPerformance;

// ── Page ──────────────────────────────────────────────────────────────────────
export default function PerformancePage() {
  const today = new Date();
  const [dateFrom, setDateFrom] = useState(toISO(firstDayOfMonth(today)));
  const [dateTo, setDateTo] = useState(toISO(today));
  const [data, setData] = useState<UserPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('total_coefficient');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [roleFilter, setRoleFilter] = useState<string>('all');

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
    }));
    downloadExcel([{ name: 'Performans', rows }], `performans_${dateFrom}_${dateTo}`);
  }

  async function load() {
    setLoading(true);
    const rows = await assignmentService.getPerformance({ date_from: dateFrom, date_to: dateTo });
    setData(rows);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  }

  const roles = ['all', 'manager', 'supervisor', 'employee'];

  const sorted = [...data]
    .filter(r => roleFilter === 'all' || r.user_role === roleFilter)
    .sort((a, b) => {
      const av = a[sortKey] ?? -1;
      const bv = b[sortKey] ?? -1;
      const cmp = typeof av === 'string' ? (av as string).localeCompare(bv as string, 'tr') : (av as number) - (bv as number);
      return sortDir === 'asc' ? cmp : -cmp;
    });

  // Summary cards
  const totalCoeff = data.reduce((s, r) => s + r.total_coefficient, 0);
  const avgApproval = data.filter(r => r.approval_rate !== null).reduce((s, r) => s + (r.approval_rate ?? 0), 0) / (data.filter(r => r.approval_rate !== null).length || 1);
  const avgRedo = data.filter(r => r.redo_rate !== null).reduce((s, r) => s + (r.redo_rate ?? 0), 0) / (data.filter(r => r.redo_rate !== null).length || 1);
  const totalAssignments = data.reduce((s, r) => s + r.total_assignments, 0);

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <span className="text-gray-300 ml-0.5 text-[10px]">↕</span>;
    return <span className="text-indigo-500 ml-0.5 text-[10px]">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  }

  function Th({ label, k, right }: { label: string; k: SortKey; right?: boolean }) {
    return (
      <th
        className={`px-3 py-3 text-xs uppercase tracking-wider cursor-pointer select-none hover:text-gray-900 whitespace-nowrap ${right ? 'text-right' : 'text-left'}`}
        onClick={() => handleSort(k)}
      >
        {label}<SortIcon k={k} />
      </th>
    );
  }

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold">Performans</h1>
          <p className="text-sm text-gray-500 mt-0.5">Personel bazlı görev ve onay istatistikleri</p>
        </div>

        {/* Date range */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <span className="text-gray-400 text-sm">—</span>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button
            onClick={load}
            className="bg-indigo-600 text-white text-sm font-medium px-4 py-1.5 rounded-md hover:bg-indigo-700 transition-colors"
          >
            Uygula
          </button>
          <button
            onClick={handleExport}
            disabled={data.length === 0}
            className="bg-white border border-gray-300 text-gray-600 text-sm font-medium px-4 py-1.5 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-40"
          >
            ⬇ Excel
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center mt-20"><Spinner size="lg" /></div>
      ) : (
        <>
          {/* ── Summary cards ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <SummaryCard label="Toplam Atama" value={String(totalAssignments)} sub="görev" color="indigo" />
            <SummaryCard label="Toplam Katsayı" value={totalCoeff.toFixed(1)} sub="iş yükü" color="violet" />
            <SummaryCard
              label="Ort. Onay Oranı"
              value={data.some(r => r.approval_rate !== null) ? `${avgApproval.toFixed(1)}%` : '—'}
              sub="onaylanan / değerlendirilen"
              color="emerald"
            />
            <SummaryCard
              label="Ort. Tekrar Oranı"
              value={data.some(r => r.redo_rate !== null) ? `${avgRedo.toFixed(1)}%` : '—'}
              sub="redden gelen atamalar"
              color="rose"
            />
          </div>

          {/* ── Role filter ── */}
          <div className="flex gap-2 mb-4">
            {roles.map(r => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  roleFilter === r
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {r === 'all' ? 'Tümü' : `${ROLE_ICON[r]} ${ROLE_LABEL[r]}`}
              </button>
            ))}
            <span className="ml-auto text-xs text-gray-400 self-center">{sorted.length} kişi</span>
          </div>

          {/* ── Table ── */}
          <div className="bg-white rounded-xl shadow border border-gray-100 overflow-x-auto">
            <table className="min-w-full text-sm border-collapse">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <Th label="Personel" k="user_name" />
                  <Th label="Rol" k="user_role" />
                  <Th label="Atama" k="total_assignments" right />
                  <Th label="Tamamlanan" k="completed" right />
                  <Th label="Onaylanan" k="approved" right />
                  <Th label="Reddedilen" k="rejected" right />
                  <Th label="Bekleyen" k="pending" right />
                  <Th label="Katsayı" k="total_coefficient" right />
                  <Th label="Tamamlanma %" k="completion_rate" right />
                  <Th label="Onay %" k="approval_rate" right />
                  <Th label="Tekrar %" k="redo_rate" right />
                  <Th label="Ort. Deneme" k="avg_submissions_per_task" right />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sorted.map((row, i) => (
                  <tr key={row.user_id} className={i % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'}>
                    <td className="px-3 py-3 font-medium whitespace-nowrap">
                      {ROLE_ICON[row.user_role]} {row.user_name}
                    </td>
                    <td className="px-3 py-3 text-gray-500 text-xs">{ROLE_LABEL[row.user_role] ?? row.user_role}</td>
                    <td className="px-3 py-3 text-right font-mono">{row.total_assignments}</td>
                    <td className="px-3 py-3 text-right font-mono">{row.completed}</td>
                    <td className="px-3 py-3 text-right font-mono text-emerald-700">{row.approved}</td>
                    <td className="px-3 py-3 text-right font-mono text-rose-600">{row.rejected}</td>
                    <td className="px-3 py-3 text-right font-mono text-amber-600">{row.pending}</td>
                    <td className="px-3 py-3 text-right font-mono font-semibold">{row.total_coefficient.toFixed(1)}</td>
                    <td className={`px-3 py-3 text-right ${rateColor(row.completion_rate)}`}>{pct(row.completion_rate)}</td>
                    <td className={`px-3 py-3 text-right ${rateColor(row.approval_rate)}`}>{pct(row.approval_rate)}</td>
                    <td className={`px-3 py-3 text-right ${rateColor(row.redo_rate, true)}`}>{pct(row.redo_rate)}</td>
                    <td className="px-3 py-3 text-right font-mono text-gray-600">{num(row.avg_submissions_per_task, 2)}</td>
                  </tr>
                ))}
                {sorted.length === 0 && (
                  <tr>
                    <td colSpan={12} className="text-center py-10 text-gray-400">
                      Bu dönemde veri bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ── Legend ── */}
          <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-500">
            <span><span className="text-emerald-600 font-semibold">Yeşil</span> ≥ %80 iyi</span>
            <span><span className="text-amber-600 font-semibold">Sarı</span> ≥ %60 orta</span>
            <span><span className="text-rose-600 font-semibold">Kırmızı</span> &lt; %60 düşük</span>
            <span className="text-gray-400">Tekrar % için düşük değer iyidir</span>
          </div>
        </>
      )}
    </div>
  );
}

// ── Summary card ──────────────────────────────────────────────────────────────
function SummaryCard({ label, value, sub, color }: {
  label: string;
  value: string;
  sub: string;
  color: 'indigo' | 'violet' | 'emerald' | 'rose';
}) {
  const colors = {
    indigo: 'bg-indigo-50 border-indigo-100 text-indigo-700',
    violet: 'bg-violet-50 border-violet-100 text-violet-700',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    rose: 'bg-rose-50 border-rose-100 text-rose-700',
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
      <p className="text-2xl font-black tracking-tight">{value}</p>
      <p className="text-xs opacity-60 mt-0.5">{sub}</p>
    </div>
  );
}
