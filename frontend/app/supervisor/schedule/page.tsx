'use client';

import { useEffect, useMemo, useState } from 'react';
import * as scheduleService from '@/services/schedule';
import Spinner from '@/components/ui/Spinner';

interface ScheduleUser { id: number; name: string; role: string; }

function getMonday(d: Date): Date {
  const r = new Date(d);
  const day = r.getDay();
  r.setDate(r.getDate() - (day === 0 ? 6 : day - 1));
  r.setHours(0, 0, 0, 0);
  return r;
}
function addDays(d: Date, n: number): Date { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function toISO(d: Date): string { return d.toLocaleDateString('en-CA'); }

const TR_MONTHS = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
const DAY_SHORT = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];

function weekLabel(monday: Date): string {
  const sunday = addDays(monday, 6);
  return `${monday.getDate()} ${TR_MONTHS[monday.getMonth()]} – ${sunday.getDate()} ${TR_MONTHS[sunday.getMonth()]} ${sunday.getFullYear()}`;
}
function timeDisplay(t: string | null | undefined): string {
  if (!t) return '';
  return t.slice(0, 5).replace(':', '.');
}

export default function SupervisorSchedulePage() {
  const [monday, setMonday] = useState<Date>(() => getMonday(new Date()));
  const [rows, setRows] = useState<scheduleService.WorkScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  useEffect(() => {
    setLoading(true);
    scheduleService.getWeekSchedules(toISO(monday)).then(data => {
      setRows(data);
      setLoading(false);
    });
  }, [monday]);

  const users = useMemo<ScheduleUser[]>(() => {
    const map = new Map<number, ScheduleUser>();
    for (const r of rows) {
      if (!map.has(r.user_id)) {
        map.set(r.user_id, { id: r.user_id, name: r.user_name ?? '', role: r.user_role ?? '' });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  }, [rows]);

  function getCell(userId: number, dateStr: string) {
    return rows.find(r => r.user_id === userId && r.date === dateStr);
  }

  const today = toISO(new Date());

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold">Haftalık Çizelge</h1>
          <p className="text-sm text-gray-500 mt-0.5">{weekLabel(monday)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setMonday(m => getMonday(addDays(m, -7)))}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">← Önceki</button>
          <button onClick={() => setMonday(getMonday(new Date()))}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">Bu Hafta</button>
          <button onClick={() => setMonday(m => getMonday(addDays(m, 7)))}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">Sonraki →</button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center mt-20"><Spinner size="lg" /></div>
      ) : (
        <div className="overflow-x-auto rounded-xl shadow border border-gray-200">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="sticky left-0 bg-gray-800 px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider w-36 z-10">İsim</th>
                {weekDates.map((d, i) => (
                  <th key={i} className={`px-3 py-3 text-center font-semibold text-xs uppercase tracking-wider min-w-[120px] ${toISO(d) === today ? 'bg-indigo-700' : ''}`}>
                    <div>{DAY_SHORT[i]}</div>
                    <div className="text-gray-400 font-normal text-[10px]">{d.getDate()} {TR_MONTHS[d.getMonth()]}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, ri) => {
                const rowBg = (['bg-white', 'bg-[#f3f4f6]', 'bg-[#e5e7eb]'] as const)[ri % 3];
                return (
                <tr key={u.id} className={rowBg}>
                  <td className={`sticky left-0 z-10 px-4 py-3 font-bold text-sm border-r border-[#d1d5db] ${rowBg}`}>
                    <div className="text-gray-900">{u.name}</div>
                    <div className="text-[10px] text-gray-500 font-normal mt-0.5">
                      {u.role === 'manager' ? 'Yönetici' : u.role === 'supervisor' ? 'Şef' : u.role === 'employee' ? 'Personel' : u.role}
                    </div>
                  </td>
                  {weekDates.map((d, di) => {
                    const dateStr = toISO(d);
                    const cell = getCell(u.id, dateStr);
                    const isOff = cell?.is_off;
                    const hasTime = !!cell?.start_time;
                    return (
                      <td
                        key={di}
                        className={`border border-[#d1d5db] text-center py-3 px-2 transition-colors hover:bg-[#e0f2fe]
                          ${isOff ? 'bg-green-100' : dateStr === today && !isOff ? 'bg-indigo-50' : ''}`}
                      >
                        {isOff ? (
                          <span className="text-[#000000] font-semibold text-sm">OFF</span>
                        ) : hasTime ? (
                          <span className="text-[#000000] font-semibold text-sm whitespace-nowrap">
                            {timeDisplay(cell!.start_time!)} / {timeDisplay(cell!.end_time)}
                          </span>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
                );
              })}
              {users.length === 0 && (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">Kullanıcı bulunamadı.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex gap-4 mt-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-100 border border-green-600" />OFF — İzin günü</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-indigo-50 border border-indigo-300" />Bugün</span>
      </div>
    </div>
  );
}
