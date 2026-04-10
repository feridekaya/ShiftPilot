'use client';

import { useEffect, useRef, useState } from 'react';
import * as breakService from '@/services/breaks';
import { Break, BreakSummary } from '@/services/breaks';
import { downloadExcel } from '@/lib/excel';

const ROLE_LABEL: Record<string, string> = { manager: 'Yönetici', supervisor: 'Şef', employee: 'Personel' };
const ROLE_ICON: Record<string, string> = { manager: '👑', supervisor: '🎯', employee: '👤' };
const LIMITS: Record<'lunch' | 'short', number> = { lunch: 20 * 60, short: 10 * 60 };

function formatTime(secs: number): string {
  const s = Math.max(0, secs);
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

function toISO(d: Date) {
  return d.toLocaleDateString('en-CA');
}

// ── Live card ─────────────────────────────────────────────────────────────────
function LiveCard({ brk, now }: { brk: Break; now: number }) {
  const startedMs = new Date(brk.started_at).getTime();
  const elapsed = Math.floor((now - startedMs) / 1000);
  const limit = LIMITS[brk.break_type as 'lunch' | 'short'];
  const remaining = limit - elapsed;
  const isOvertime = remaining < 0;
  const progress = Math.min(elapsed / limit, 1);

  return (
    <div className={`rounded-xl border p-4 ${isOvertime ? 'border-red-200 bg-red-50' : brk.break_type === 'lunch' ? 'border-amber-200 bg-amber-50' : 'border-blue-200 bg-blue-50'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{brk.break_type === 'lunch' ? '🍽️' : '☕'}</span>
          <div>
            <p className="font-semibold text-sm text-gray-800">
              {ROLE_ICON[brk.user_role]} {brk.user_name}
            </p>
            <p className="text-xs text-gray-500">{ROLE_LABEL[brk.user_role]} · {brk.break_type === 'lunch' ? 'Yemek' : 'Kısa'} Mola</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-xl font-black font-mono ${isOvertime ? 'text-red-600' : 'text-gray-800'}`}>
            {isOvertime ? '+' : ''}{formatTime(Math.abs(remaining))}
          </p>
          <p className="text-[10px] text-gray-400">{isOvertime ? 'SÜRE DOLDU' : 'kalan'}</p>
        </div>
      </div>
      {/* Progress */}
      <div className="mt-3 bg-white/70 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-1.5 rounded-full ${isOvertime ? 'bg-red-500' : brk.break_type === 'lunch' ? 'bg-amber-400' : 'bg-blue-400'}`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <p className="text-[10px] text-gray-400 mt-1">
        Başladı: {new Date(brk.started_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
        {' · '}Geçen: {formatTime(elapsed)}
      </p>
    </div>
  );
}

// ── Per-user daily average from raw break records ─────────────────────────────
interface UserAvg {
  user_id: number;
  user_name: string;
  user_role: string;
  days_active: number;
  avg_total_min: number;
  avg_lunch: number;  // avg lunches per day
  avg_short: number;  // avg short breaks per day
}

function computeAverages(breaks: Break[]): UserAvg[] {
  // group by user → date → list of breaks
  const byUser: Record<number, { name: string; role: string; byDate: Record<string, Break[]> }> = {};
  for (const b of breaks) {
    if (!byUser[b.user]) byUser[b.user] = { name: b.user_name, role: b.user_role, byDate: {} };
    const d = b.date;
    if (!byUser[b.user].byDate[d]) byUser[b.user].byDate[d] = [];
    byUser[b.user].byDate[d].push(b);
  }

  return Object.entries(byUser).map(([uid, info]) => {
    const dates = Object.values(info.byDate);
    const days = dates.length;
    const totalMin = dates.reduce((s, day) => s + day.reduce((ss, b) => ss + b.duration_minutes, 0), 0);
    const totalLunch = dates.reduce((s, day) => s + day.filter(b => b.break_type === 'lunch').length, 0);
    const totalShort = dates.reduce((s, day) => s + day.filter(b => b.break_type === 'short').length, 0);
    return {
      user_id: Number(uid),
      user_name: info.name,
      user_role: info.role,
      days_active: days,
      avg_total_min: days ? totalMin / days : 0,
      avg_lunch: days ? totalLunch / days : 0,
      avg_short: days ? totalShort / days : 0,
    };
  }).sort((a, b) => b.avg_total_min - a.avg_total_min);
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ManagerBreaksPage() {
  const today = toISO(new Date());
  const thirtyDaysAgo = toISO(new Date(Date.now() - 30 * 86400_000));

  const [activeBreaks, setActiveBreaks] = useState<Break[]>([]);
  const [summary, setSummary] = useState<BreakSummary[]>([]);
  const [summaryDate, setSummaryDate] = useState(today);
  const [averages, setAverages] = useState<UserAvg[]>([]);
  const [avgRange, setAvgRange] = useState<{ from: string; to: string }>({ from: thirtyDaysAgo, to: today });
  const [avgLoading, setAvgLoading] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function loadActive() {
    const brks = await breakService.getActiveBreaks();
    setActiveBreaks(brks);
  }

  async function loadAverages(from: string, to: string) {
    setAvgLoading(true);
    const brks = await breakService.getBreaks({ date_from: from, date_to: to });
    setAverages(computeAverages(brks));
    setAvgLoading(false);
  }

  function handleExport() {
    const rows = summary.map(r => ({
      'Tarih': r.date,
      'İsim': r.user_name,
      'Rol': ROLE_LABEL[r.user_role] ?? r.user_role,
      'Yemek Molası': r.lunch_used ? '1' : '0',
      'Kısa Mola Sayısı': r.short_count,
      'Toplam (dk)': r.total_minutes,
    }));
    downloadExcel([{ name: 'Molalar', rows }], `molalar_${summaryDate}`);
  }

  async function loadSummary(date: string) {
    const rows = await breakService.getBreakSummary(date);
    setSummary(rows);
  }

  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([loadActive(), loadSummary(summaryDate), loadAverages(thirtyDaysAgo, today)]);
      setLoading(false);
    }
    init();

    // Poll active breaks every 5s
    pollRef.current = setInterval(loadActive, 5_000);
    // Tick every second for timer display
    tickRef.current = setInterval(() => setNow(Date.now()), 1_000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  async function handleDateChange(date: string) {
    setSummaryDate(date);
    await loadSummary(date);
  }

  const overtimeCount = activeBreaks.filter(b => {
    const elapsed = (now - new Date(b.started_at).getTime()) / 1000;
    return elapsed > LIMITS[b.break_type as 'lunch' | 'short'];
  }).length;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h1 className="text-xl font-bold">Molalar</h1>
          <p className="text-sm text-gray-500 mt-0.5">Canlı takip ve günlük özet</p>
        </div>
        {overtimeCount > 0 && (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full">
            ⚠ {overtimeCount} kişi süre aştı
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center mt-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
        </div>
      ) : (
        <div className="flex flex-col gap-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* ── Live section ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
                Şu An Molada
              </h2>
              <span className="text-xs text-gray-400">{activeBreaks.length} kişi</span>
            </div>

            {activeBreaks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center text-gray-400 text-sm">
                Şu an molada olan yok
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {activeBreaks.map(b => (
                  <LiveCard key={b.id} brk={b} now={now} />
                ))}
              </div>
            )}
          </div>

          {/* ── Daily summary section ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-800">Günlük Özet</h2>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={summaryDate}
                  onChange={e => handleDateChange(e.target.value)}
                  className="border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <button
                  onClick={handleExport}
                  disabled={summary.length === 0}
                  className="text-xs px-2 py-1 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-600 disabled:opacity-40"
                >
                  ⬇ Excel
                </button>
              </div>
            </div>

            {summary.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center text-gray-400 text-sm">
                Bu tarihte mola kaydı yok
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 shadow overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3 text-left">Personel</th>
                      <th className="px-4 py-3 text-center">Yemek</th>
                      <th className="px-4 py-3 text-center">Kısa</th>
                      <th className="px-4 py-3 text-right">Toplam</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {summary.map((row, i) => {
                      const isLong = row.total_minutes > 35; // over limit threshold
                      return (
                        <tr key={`${row.user_id}-${row.date}`} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-3 font-medium">
                            {ROLE_ICON[row.user_role]} {row.user_name}
                            <span className="text-[10px] text-gray-400 ml-1">{ROLE_LABEL[row.user_role]}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {row.lunch_used
                              ? <span className="text-amber-600 text-xs font-medium">✓ 1</span>
                              : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {row.short_count > 0
                              ? <span className="text-blue-600 text-xs font-medium">{row.short_count}×</span>
                              : <span className="text-gray-300">—</span>}
                          </td>
                          <td className={`px-4 py-3 text-right font-mono font-semibold ${isLong ? 'text-red-600' : 'text-gray-700'}`}>
                            {row.total_minutes.toFixed(1)} dk
                            {isLong && <span className="ml-1 text-[10px] text-red-500">↑</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t border-gray-200">
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-xs text-gray-500 font-medium">Toplam</td>
                      <td className="px-4 py-2 text-right text-xs font-bold text-gray-700 font-mono">
                        {summary.reduce((s, r) => s + r.total_minutes, 0).toFixed(1)} dk
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>{/* end grid */}

        {/* ── Daily Averages ── */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div>
              <h2 className="font-semibold text-gray-800">Kişi Başı Günlük Mola Ortalaması</h2>
              <p className="text-xs text-gray-400 mt-0.5">Seçilen tarih aralığındaki iş günlerine göre hesaplanır</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={avgRange.from}
                onChange={e => setAvgRange(r => ({ ...r, from: e.target.value }))}
                className="border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <span className="text-gray-400 text-xs">→</span>
              <input
                type="date"
                value={avgRange.to}
                onChange={e => setAvgRange(r => ({ ...r, to: e.target.value }))}
                className="border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button
                onClick={() => loadAverages(avgRange.from, avgRange.to)}
                className="text-xs px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                Uygula
              </button>
            </div>
          </div>

          {avgLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : averages.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 py-10 text-center text-gray-400 text-sm">
              Bu aralıkta mola kaydı yok
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-800 text-white text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-left">Personel</th>
                    <th className="px-4 py-3 text-center">Aktif Gün</th>
                    <th className="px-4 py-3 text-center">Ort. Kısa Mola</th>
                    <th className="px-4 py-3 text-right">Ort. Toplam</th>
                    <th className="px-4 py-3 text-right">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {averages.map((row, i) => {
                    const rowBg = (['bg-white', 'bg-[#f3f4f6]', 'bg-[#e5e7eb]'] as const)[i % 3];
                    const isHigh = row.avg_total_min > 60;
                    const isLow  = row.avg_total_min <= 30;
                    return (
                      <tr key={row.user_id} className={`${rowBg} hover:bg-[#e0f2fe] transition-colors`}>
                        <td className="px-4 py-3 font-medium text-gray-800">
                          <span className="mr-1">{ROLE_ICON[row.user_role] ?? '👤'}</span>
                          {row.user_name}
                          <span className="text-[10px] text-gray-400 ml-1.5">{ROLE_LABEL[row.user_role]}</span>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-600 text-xs">{row.days_active} gün</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs font-semibold ${row.avg_short > 0 ? 'text-blue-500' : 'text-gray-400'}`}>
                            {row.avg_short.toFixed(1)}×
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-right font-mono font-bold text-sm ${isHigh ? 'text-red-600' : isLow ? 'text-gray-400' : 'text-gray-700'}`}>
                          {row.avg_total_min.toFixed(1)} dk
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isHigh
                            ? <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">↑ Yüksek</span>
                            : isLow
                            ? <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">↓ Az</span>
                            : <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">✓ Normal</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
                  <tr>
                    <td colSpan={3} className="px-4 py-2 font-medium">Tüm personel ortalaması</td>
                    <td className="px-4 py-2 text-right font-mono font-bold text-gray-700">
                      {averages.length ? (averages.reduce((s, r) => s + r.avg_total_min, 0) / averages.length).toFixed(1) : '—'} dk
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
        </div>
      )}
    </div>
  );
}
