'use client';

import { useEffect, useRef, useState } from 'react';
import { User } from '@/types';
import * as userService from '@/services/users';
import * as scheduleService from '@/services/schedule';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

// ── Date utils ────────────────────────────────────────────────────────────────
function getMonday(d: Date): Date {
  const r = new Date(d);
  const day = r.getDay();
  r.setDate(r.getDate() - (day === 0 ? 6 : day - 1));
  r.setHours(0, 0, 0, 0);
  return r;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function toISO(d: Date): string {
  return d.toLocaleDateString('en-CA'); // YYYY-MM-DD
}

const TR_MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const DAY_SHORT = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

function weekLabel(monday: Date): string {
  const sunday = addDays(monday, 6);
  return `${monday.getDate()} ${TR_MONTHS[monday.getMonth()]} – ${sunday.getDate()} ${TR_MONTHS[sunday.getMonth()]} ${sunday.getFullYear()}`;
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface Cell {
  is_off: boolean;
  start_time: string;
  end_time: string;
}

const EMPTY: Cell = { is_off: false, start_time: '', end_time: '' };

// cell key: `${userId}|${dateStr}`
type CellMap = Record<string, Cell>;

function cellKey(userId: number, dateStr: string) {
  return `${userId}|${dateStr}`;
}

function timeDisplay(t: string | null): string {
  if (!t) return '';
  return t.slice(0, 5).replace(':', '.');
}

// ── Cell editor (inline popover) ──────────────────────────────────────────────
interface EditorProps {
  cell: Cell;
  onSave: (c: Cell) => void;
  onClose: () => void;
}

function CellEditor({ cell, onSave, onClose }: EditorProps) {
  const [local, setLocal] = useState<Cell>(cell);
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter') { onSave(local); onClose(); }
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [local, onSave, onClose]);

  return (
    <div
      ref={ref}
      className="absolute z-50 top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl p-3 w-52"
      onMouseDown={e => e.stopPropagation()}
    >
      {/* OFF toggle */}
      <label className="flex items-center gap-2 mb-3 cursor-pointer">
        <div
          onClick={() => setLocal(l => ({ ...l, is_off: !l.is_off, start_time: '', end_time: '' }))}
          className={`relative w-10 h-5 rounded-full transition-colors ${local.is_off ? 'bg-green-500' : 'bg-gray-200'}`}
        >
          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${local.is_off ? 'left-5' : 'left-0.5'}`} />
        </div>
        <span className={`text-sm font-bold ${local.is_off ? 'text-green-600' : 'text-gray-400'}`}>OFF</span>
      </label>

      {/* Time inputs */}
      {!local.is_off && (
        <div className="flex flex-col gap-2 mb-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 w-12">Giriş</label>
            <input
              type="time"
              value={local.start_time}
              onChange={e => setLocal(l => ({ ...l, start_time: e.target.value }))}
              className="flex-1 border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 w-12">Çıkış</label>
            <input
              type="time"
              value={local.end_time}
              onChange={e => setLocal(l => ({ ...l, end_time: e.target.value }))}
              className="flex-1 border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          {/* Quick presets */}
          <div className="flex flex-wrap gap-1 mt-1">
            {[['09:00','18:00'], ['10:00','19:00'], ['13:00','22:00'], ['16:00','02:00'], ['16:00','03:00']].map(([s, e]) => (
              <button
                key={s+e}
                type="button"
                onClick={() => setLocal(l => ({ ...l, start_time: s, end_time: e, is_off: false }))}
                className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 hover:bg-indigo-100 text-gray-600 hover:text-indigo-700 transition-colors"
              >
                {s.replace(':','.')}-{e.replace(':','.')}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => { onSave(local); onClose(); }}
          className="flex-1 bg-indigo-600 text-white text-xs font-bold py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Tamam
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 bg-gray-100 text-gray-600 text-xs font-bold py-1.5 rounded-lg hover:bg-gray-200 transition-colors"
        >
          İptal
        </button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SchedulePage() {
  const [monday, setMonday] = useState<Date>(() => getMonday(new Date()));
  const [users, setUsers] = useState<User[]>([]);
  const [cells, setCells] = useState<CellMap>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  // Load users + schedules when week changes
  useEffect(() => {
    setLoading(true);
    setEditing(null);
    Promise.all([
      userService.getUsers(),
      scheduleService.getWeekSchedules(toISO(monday)),
    ]).then(([allUsers, schedules]) => {
      setUsers(allUsers.filter(u => u.is_active));

      const map: CellMap = {};
      for (const s of schedules) {
        const key = cellKey(s.user_id, s.date);
        map[key] = {
          is_off: s.is_off,
          start_time: s.start_time?.slice(0, 5) ?? '',
          end_time: s.end_time?.slice(0, 5) ?? '',
        };
      }
      setCells(map);
      setDirty(false);
      setLoading(false);
    });
  }, [monday]);

  function getCell(userId: number, dateStr: string): Cell {
    return cells[cellKey(userId, dateStr)] ?? EMPTY;
  }

  function updateCell(userId: number, dateStr: string, value: Cell) {
    setCells(prev => ({ ...prev, [cellKey(userId, dateStr)]: value }));
    setDirty(true);
  }

  async function copyPreviousWeek() {
    const prevMonday = getMonday(addDays(monday, -7));
    const prevSchedules = await scheduleService.getWeekSchedules(toISO(prevMonday));
    if (!prevSchedules.length) return;

    const map: typeof cells = {};
    for (const s of prevSchedules) {
      // Shift date forward by 7 days to map onto current week
      const prevDate = new Date(s.date + 'T12:00:00');
      const thisDate = toISO(addDays(prevDate, 7));
      const user = users.find(u => u.id === s.user_id);
      if (!user) continue;
      map[cellKey(s.user_id, thisDate)] = {
        is_off: s.is_off,
        start_time: s.start_time?.slice(0, 5) ?? '',
        end_time: s.end_time?.slice(0, 5) ?? '',
      };
    }
    setCells(prev => ({ ...prev, ...map }));
    setDirty(true);
  }

  async function handleSave() {
    setSaving(true);
    const payload: scheduleService.WorkScheduleEntry[] = [];
    for (const [key, cell] of Object.entries(cells)) {
      const [userId, dateStr] = key.split('|');
      if (cell.is_off || cell.start_time) {
        payload.push({
          user_id: Number(userId),
          date: dateStr,
          is_off: cell.is_off,
          start_time: cell.start_time || null,
          end_time: cell.end_time || null,
        });
      }
    }
    await scheduleService.bulkSaveSchedules(payload);
    setSaving(false);
    setDirty(false);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold">Haftalık Çizelge</h1>
          <p className="text-sm text-gray-500 mt-0.5">{weekLabel(monday)}</p>
        </div>
        <div className="flex items-center gap-2">
          {dirty && (
            <span className="text-xs text-amber-600 font-medium bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
              Kaydedilmemiş değişiklikler
            </span>
          )}
          <Button variant="secondary" size="sm" onClick={() => setMonday(m => getMonday(addDays(m, -7)))}>← Önceki</Button>
          <Button variant="secondary" size="sm" onClick={() => setMonday(getMonday(new Date()))}>Bu Hafta</Button>
          <Button variant="secondary" size="sm" onClick={() => setMonday(m => getMonday(addDays(m, 7)))}>Sonraki →</Button>
          <Button variant="secondary" size="sm" onClick={copyPreviousWeek}>↩ Geçen Haftayı Getir</Button>
          <Button size="sm" isLoading={saving} onClick={handleSave}>
            {dirty ? 'Kaydet ●' : 'Kaydet'}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center mt-20"><Spinner size="lg" /></div>
      ) : (
        <div className="overflow-x-auto rounded-xl shadow border border-gray-100">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="sticky left-0 bg-gray-800 px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider w-36 z-10">
                  İsim
                </th>
                {weekDates.map((d, i) => (
                  <th key={i} className="px-3 py-3 text-center font-semibold text-xs uppercase tracking-wider min-w-[110px]">
                    <div>{DAY_SHORT[i]}</div>
                    <div className="text-gray-400 font-normal text-[10px]">
                      {d.getDate()} {TR_MONTHS[d.getMonth()]}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, ri) => (
                <tr key={u.id} className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {/* Sticky name column */}
                  <td className={`sticky left-0 z-10 px-4 py-2 font-bold text-sm border-r border-gray-100 ${ri % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <div>{u.name}</div>
                    <div className="text-[10px] text-gray-400 font-normal">{
                      u.role === 'manager' ? 'Yönetici' : u.role === 'supervisor' ? 'Şef' : 'Personel'
                    }</div>
                  </td>

                  {weekDates.map((d, di) => {
                    const dateStr = toISO(d);
                    const key = cellKey(u.id, dateStr);
                    const cell = getCell(u.id, dateStr);
                    const isEditing = editing === key;
                    const hasValue = cell.is_off || !!cell.start_time;

                    return (
                      <td
                        key={di}
                        className="relative border-l border-gray-100 p-0"
                      >
                        <div
                          onClick={() => setEditing(isEditing ? null : key)}
                          className={`
                            h-full min-h-[48px] flex flex-col items-center justify-center cursor-pointer px-2 py-2 transition-colors
                            ${cell.is_off
                              ? 'bg-green-50 hover:bg-green-100'
                              : hasValue
                                ? 'hover:bg-blue-50'
                                : 'hover:bg-gray-100'}
                          `}
                        >
                          {cell.is_off ? (
                            <span className="text-green-700 font-bold text-xs tracking-wider">OFF</span>
                          ) : hasValue ? (
                            <>
                              <span className="text-gray-800 font-semibold text-xs">
                                {timeDisplay(cell.start_time)}
                              </span>
                              <span className="text-gray-400 text-[9px]">—</span>
                              <span className="text-gray-800 font-semibold text-xs">
                                {timeDisplay(cell.end_time)}
                              </span>
                            </>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </div>

                        {isEditing && (
                          <CellEditor
                            cell={cell}
                            onSave={val => updateCell(u.id, dateStr, val)}
                            onClose={() => setEditing(null)}
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-400">Aktif kullanıcı bulunamadı.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-4 mt-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-green-100 border border-green-300" />
          OFF — İzin günü
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-blue-50 border border-blue-200" />
          Çalışma saati
        </span>
        <span className="text-gray-400">Hücreye tıklayarak düzenleyebilirsiniz · Enter ile onaylayın</span>
      </div>
    </div>
  );
}
