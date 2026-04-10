'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as breakService from '@/services/breaks';
import { Break } from '@/services/breaks';

// ── Constants ─────────────────────────────────────────────────────────────────
const BREAK_LIMITS: Record<'lunch' | 'short', number> = {
  lunch: 20 * 60,
  short: 10 * 60,
};
const BREAK_LABEL: Record<'lunch' | 'short', string> = {
  lunch: 'Yemek Molası',
  short: 'Kısa Mola',
};
const BREAK_COLOR: Record<'lunch' | 'short', { bg: string; ring: string; text: string; bar: string; dot: string }> = {
  lunch: { bg: 'bg-amber-50', ring: 'ring-amber-400', text: 'text-amber-700', bar: 'bg-amber-400', dot: 'bg-amber-400' },
  short: { bg: 'bg-blue-50',  ring: 'ring-blue-400',  text: 'text-blue-700',  bar: 'bg-blue-400',  dot: 'bg-blue-400'  },
};
const TR_MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const TR_DAYS_SHORT = ['Pt','Sa','Ça','Pe','Cu','Ct','Pz'];

function formatTime(secs: number): string {
  const s = Math.max(0, secs);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
function todayISO(): string { return new Date().toLocaleDateString('en-CA'); }

// ── Page ──────────────────────────────────────────────────────────────────────
export default function EmployeeBreaksPage() {
  const [tab, setTab] = useState<'break' | 'history'>('break');
  const [active, setActive] = useState<Break | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [todayBreaks, setTodayBreaks] = useState<Break[]>([]);

  // Refs that the interval reads — always current, no stale closure
  const activeRef = useRef<Break | null>(null);
  const endingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Calendar state
  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [calBreaks, setCalBreaks] = useState<Break[]>([]);
  const [calLoading, setCalLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Keep ref in sync with state
  useEffect(() => { activeRef.current = active; }, [active]);

  // ── Auto-end: called from the interval, no stale closure issues ──
  const autoEnd = useCallback(async () => {
    if (endingRef.current) return;
    endingRef.current = true;
    try {
      const finished = await breakService.endBreak();
      setActive(null);
      setElapsed(0);
      setTodayBreaks(prev => [finished, ...prev]);
    } finally {
      endingRef.current = false;
    }
  }, []);

  // ── Single interval: ticks elapsed AND triggers auto-end ──
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (!active) return;

    const startedMs = new Date(active.started_at).getTime();
    const limit = BREAK_LIMITS[active.break_type as 'lunch' | 'short'];

    timerRef.current = setInterval(() => {
      const secs = Math.floor((Date.now() - startedMs) / 1000);
      setElapsed(secs);

      if (secs >= limit && activeRef.current && !endingRef.current) {
        clearInterval(timerRef.current!);
        autoEnd();
      }
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [active, autoEnd]);

  // ── Load today ──
  async function loadState() {
    setLoading(true);
    try {
      const today = todayISO();
      const [cur, hist] = await Promise.all([
        breakService.getMyActiveBreak(),
        breakService.getBreaks({ date: today }),
      ]);

      if (cur) {
        const elapsedSecs = Math.floor((Date.now() - new Date(cur.started_at).getTime()) / 1000);
        const limit = BREAK_LIMITS[cur.break_type as 'lunch' | 'short'];
        if (elapsedSecs >= limit) {
          // Already expired — end it immediately (Celery may not have run yet)
          try {
            const finished = await breakService.endBreak();
            setTodayBreaks([finished, ...hist.filter(b => !b.is_active)]);
          } catch {
            setTodayBreaks(hist.filter(b => !b.is_active));
          }
          setActive(null);
          setElapsed(0);
        } else {
          setActive(cur);
          setElapsed(elapsedSecs);
          setTodayBreaks(hist.filter(b => !b.is_active));
        }
      } else {
        setTodayBreaks(hist.filter(b => !b.is_active));
      }
    } finally { setLoading(false); }
  }

  // ── Load calendar month ──
  async function loadCalendar(year: number, month: number) {
    setCalLoading(true);
    const from = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const to = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    const data = await breakService.getBreaks({ date_from: from, date_to: to });
    setCalBreaks(data);
    setCalLoading(false);
  }

  useEffect(() => { loadState(); }, []);
  useEffect(() => {
    if (tab === 'history') loadCalendar(calMonth.year, calMonth.month);
  }, [tab, calMonth]);

  async function handleStart(type: 'lunch' | 'short') {
    setError('');
    setStarting(true);
    endingRef.current = false;
    try {
      const brk = await breakService.startBreak(type);
      setActive(brk);
      setElapsed(0);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error ?? 'Mola başlatılamadı.');
    } finally { setStarting(false); }
  }

  const totalMinutesToday = todayBreaks.reduce((s, b) => s + b.duration_minutes, 0) + (active ? elapsed / 60 : 0);
  const lunchUsedToday = todayBreaks.some(b => b.break_type === 'lunch') || active?.break_type === 'lunch';

  // ── Calendar helpers ──
  const { year, month } = calMonth;
  const firstDow = new Date(year, month, 1).getDay();
  const firstMondayOffset = firstDow === 0 ? -6 : 1 - firstDow;

  const breaksByDate: Record<string, Break[]> = {};
  for (const b of calBreaks) {
    if (!breaksByDate[b.date]) breaksByDate[b.date] = [];
    breaksByDate[b.date].push(b);
  }

  const cells: Array<{ day: number; iso: string; inMonth: boolean }> = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(year, month, 1 + i + firstMondayOffset);
    cells.push({ day: d.getDate(), iso: d.toLocaleDateString('en-CA'), inMonth: d.getMonth() === month });
  }

  const selectedBreaks = selectedDate ? (breaksByDate[selectedDate] ?? []) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-8">
        {(['break', 'history'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
              tab === t ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'break' ? 'Mola' : 'Geçmiş'}
          </button>
        ))}
      </div>

      {/* ══ BREAK TAB ══ */}
      {tab === 'break' && (
        <>
          <p className="text-sm text-gray-500 mb-6">
            Bugün toplam: <span className="font-semibold text-gray-700">{totalMinutesToday.toFixed(1)} dk</span>
          </p>

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</div>
          )}

          {active ? (
            <ActiveBreakCard brk={active} elapsed={elapsed} />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              <BreakButton type="lunch" disabled={lunchUsedToday || starting} used={lunchUsedToday} onClick={() => handleStart('lunch')} />
              <BreakButton type="short" disabled={starting} used={false} onClick={() => handleStart('short')} />
            </div>
          )}

          {todayBreaks.length > 0 && (
            <div className="mt-10">
              <p className="text-xs uppercase tracking-wider text-gray-400 mb-3 font-medium">Bugünkü Molalar</p>
              <BreakList breaks={todayBreaks} />
            </div>
          )}
        </>
      )}

      {/* ══ HISTORY TAB ══ */}
      {tab === 'history' && (
        <>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCalMonth(m => { const d = new Date(m.year, m.month - 1); return { year: d.getFullYear(), month: d.getMonth() }; })}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 font-bold"
            >‹</button>
            <p className="font-semibold text-gray-800">{TR_MONTHS[month]} {year}</p>
            <button
              onClick={() => setCalMonth(m => { const d = new Date(m.year, m.month + 1); return { year: d.getFullYear(), month: d.getMonth() }; })}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 font-bold"
            >›</button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {TR_DAYS_SHORT.map(d => (
              <div key={d} className="text-center text-[10px] font-medium text-gray-400 py-1">{d}</div>
            ))}
          </div>

          {calLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {cells.map((cell, i) => {
                const breaks = breaksByDate[cell.iso] ?? [];
                const hasLunch = breaks.some(b => b.break_type === 'lunch');
                const shortCount = breaks.filter(b => b.break_type === 'short').length;
                const isToday = cell.iso === todayISO();
                const isSelected = selectedDate === cell.iso;
                const hasDot = breaks.length > 0;
                return (
                  <button
                    key={i}
                    onClick={() => cell.inMonth && hasDot && setSelectedDate(isSelected ? null : cell.iso)}
                    disabled={!cell.inMonth || !hasDot}
                    className={`
                      relative aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 transition-colors text-sm
                      ${!cell.inMonth ? 'text-gray-200' : ''}
                      ${cell.inMonth && !hasDot ? 'text-gray-400 cursor-default' : ''}
                      ${cell.inMonth && hasDot && !isSelected ? 'text-gray-800 hover:bg-gray-100 cursor-pointer' : ''}
                      ${isSelected ? 'bg-indigo-600 text-white' : ''}
                      ${isToday && !isSelected ? 'ring-2 ring-indigo-400' : ''}
                    `}
                  >
                    <span className="font-semibold text-sm leading-none">{cell.day}</span>
                    {cell.inMonth && hasDot && (
                      <div className="flex gap-0.5">
                        {hasLunch && <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-300' : 'bg-amber-400'}`} />}
                        {shortCount > 0 && <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-blue-300' : 'bg-blue-400'}`} />}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex gap-4 mt-3 text-xs text-gray-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" />Yemek</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400" />Kısa</span>
            <span className="flex items-center gap-1 ml-auto"><span className="w-3 h-3 rounded-full ring-2 ring-indigo-400 inline-block" />Bugün</span>
          </div>

          {selectedDate && selectedBreaks.length > 0 && (
            <div className="mt-6">
              <p className="text-xs uppercase tracking-wider text-gray-400 mb-3 font-medium">
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <BreakList breaks={selectedBreaks} />
              <p className="text-xs text-gray-400 mt-2 text-right">
                Toplam: <span className="font-semibold text-gray-600">
                  {selectedBreaks.reduce((s, b) => s + b.duration_minutes, 0).toFixed(1)} dk
                </span>
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Shared break list ─────────────────────────────────────────────────────────
function BreakList({ breaks }: { breaks: Break[] }) {
  return (
    <div className="flex flex-col gap-2">
      {breaks.map(b => (
        <div key={b.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
          <div className="flex items-center gap-3">
            <span className={`w-2 h-2 rounded-full ${BREAK_COLOR[b.break_type as 'lunch' | 'short'].dot}`} />
            <div>
              <p className="text-sm font-medium text-gray-800">{BREAK_LABEL[b.break_type as 'lunch' | 'short']}</p>
              <p className="text-xs text-gray-400">
                {new Date(b.started_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                {' — '}
                {b.ended_at ? new Date(b.ended_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '...'}
              </p>
            </div>
          </div>
          <span className="text-sm font-mono font-semibold text-gray-600">{b.duration_minutes.toFixed(1)} dk</span>
        </div>
      ))}
    </div>
  );
}

// ── Active break card ─────────────────────────────────────────────────────────
function ActiveBreakCard({ brk, elapsed }: { brk: Break; elapsed: number }) {
  const type = brk.break_type as 'lunch' | 'short';
  const limit = BREAK_LIMITS[type];
  const remaining = limit - elapsed;
  const progress = Math.min(elapsed / limit, 1);
  const colors = BREAK_COLOR[type];
  const isAlmostDone = remaining > 0 && remaining <= 60;

  return (
    <div className={`rounded-2xl ring-2 ${colors.ring} ${colors.bg} p-6 flex flex-col items-center gap-4`}>
      <div className="text-4xl">{type === 'lunch' ? '🍽️' : '☕'}</div>
      <p className={`text-sm font-bold uppercase tracking-wider ${colors.text}`}>{BREAK_LABEL[type]}</p>
      <div className={`text-6xl font-black font-mono tracking-tighter ${isAlmostDone ? 'text-orange-500 animate-pulse' : 'text-gray-800'}`}>
        {formatTime(remaining)}
      </div>
      <p className="text-xs text-gray-400">
        {isAlmostDone ? '⚠ Mola bitmek üzere' : 'Kalan süre — mola otomatik bitecek'}
      </p>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-1000 ${isAlmostDone ? 'bg-orange-400' : colors.bar}`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <p className="text-xs text-gray-400">
        Başladı: {new Date(brk.started_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
        {' · '}Geçen: {formatTime(elapsed)}
      </p>
    </div>
  );
}

// ── Break start button ────────────────────────────────────────────────────────
function BreakButton({ type, disabled, used, onClick }: {
  type: 'lunch' | 'short'; disabled: boolean; used: boolean; onClick: () => void;
}) {
  const colors = BREAK_COLOR[type];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full rounded-2xl border-2 p-5 text-left transition-all
        ${used
          ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
          : `border-transparent ${colors.bg} ring-2 ${colors.ring} hover:shadow-md active:scale-[0.98]`}
      `}
    >
      <div className="flex items-center gap-4">
        <span className="text-3xl">{type === 'lunch' ? '🍽️' : '☕'}</span>
        <div className="flex-1">
          <p className={`font-bold ${used ? 'text-gray-400' : colors.text}`}>{BREAK_LABEL[type]}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {BREAK_LIMITS[type] / 60} dakika · {type === 'lunch' ? 'Günde 1 kez' : 'Sınırsız'}
          </p>
        </div>
        {used
          ? <span className="text-xs text-gray-400 font-medium">Kullanıldı ✓</span>
          : <span className={`text-xs font-bold ${colors.text} opacity-70`}>Başlat →</span>
        }
      </div>
    </button>
  );
}
