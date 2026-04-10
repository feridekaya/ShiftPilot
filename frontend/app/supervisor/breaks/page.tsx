'use client';

import { useEffect, useRef, useState } from 'react';
import * as breakService from '@/services/breaks';
import { Break, BreakSummary } from '@/services/breaks';

const ROLE_LABEL: Record<string, string> = { manager: 'Yönetici', supervisor: 'Şef', employee: 'Personel' };
const ROLE_ICON: Record<string, string> = { manager: '👑', supervisor: '🎯', employee: '👤' };
const LIMITS: Record<'lunch' | 'short', number> = { lunch: 20 * 60, short: 10 * 60 };

function formatTime(secs: number): string {
  const s = Math.max(0, secs);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
function toISO(d: Date) { return d.toLocaleDateString('en-CA'); }

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
            <p className="font-semibold text-sm text-gray-800">{ROLE_ICON[brk.user_role]} {brk.user_name}</p>
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

export default function SupervisorBreaksPage() {
  const today = toISO(new Date());
  const [tab, setTab] = useState<'live' | 'summary'>('live');
  const [activeBreaks, setActiveBreaks] = useState<Break[]>([]);
  const [summary, setSummary] = useState<BreakSummary[]>([]);
  const [summaryDate, setSummaryDate] = useState(today);
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function loadSummary(date: string) {
    setSummaryLoading(true);
    const rows = await breakService.getBreakSummary(date);
    setSummary(rows);
    setSummaryLoading(false);
  }

  useEffect(() => {
    breakService.getActiveBreaks().then(b => { setActiveBreaks(b); setLoading(false); });
    pollRef.current = setInterval(() => breakService.getActiveBreaks().then(setActiveBreaks), 5_000);
    tickRef.current = setInterval(() => setNow(Date.now()), 1_000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  useEffect(() => {
    if (tab === 'summary') loadSummary(summaryDate);
  }, [tab]);

  const overtimeCount = activeBreaks.filter(b => {
    const elapsed = (now - new Date(b.started_at).getTime()) / 1000;
    return elapsed > LIMITS[b.break_type as 'lunch' | 'short'];
  }).length;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold">Molalar</h1>
          <p className="text-sm text-gray-500 mt-0.5">Canlı takip ve günlük özet</p>
        </div>
        {overtimeCount > 0 && (
          <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full">
            ⚠ {overtimeCount} kişi süre aştı
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 max-w-xs">
        {(['live', 'summary'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === t ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'live' ? 'Şu An Molada' : 'Günlük Özet'}
          </button>
        ))}
      </div>

      {/* ── Live tab ── */}
      {tab === 'live' && (
        loading ? (
          <div className="flex justify-center mt-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
          </div>
        ) : activeBreaks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 py-16 text-center">
            <p className="text-4xl mb-3">☕</p>
            <p className="text-gray-400 text-sm">Şu an molada olan yok</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {activeBreaks.map(b => <LiveCard key={b.id} brk={b} now={now} />)}
          </div>
        )
      )}

      {/* ── Summary tab ── */}
      {tab === 'summary' && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <input
              type="date"
              value={summaryDate}
              onChange={e => { setSummaryDate(e.target.value); loadSummary(e.target.value); }}
              className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {summaryLoading ? (
            <div className="flex justify-center mt-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : summary.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 py-16 text-center">
              <p className="text-gray-400 text-sm">Bu tarihte mola kaydı yok</p>
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
                <tbody>
                  {summary.map((row, i) => {
                    const isLong = row.total_minutes > 35;
                    const rowBg = (['bg-white', 'bg-[#f8f9fa]', 'bg-[#f0f2f5]'] as const)[i % 3];
                    return (
                      <tr key={`${row.user_id}-${row.date}`} className={rowBg}>
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
      )}

      {tab === 'live' && <p className="text-[10px] text-gray-300 mt-6 text-center">Her 5 saniyede güncellenir</p>}
    </div>
  );
}
