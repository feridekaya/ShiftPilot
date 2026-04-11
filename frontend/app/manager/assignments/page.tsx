'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { User, Task, TaskCategory, TaskSchedule, Assignment } from '@/types';
import * as userService from '@/services/users';
import * as taskService from '@/services/tasks';
import * as assignmentService from '@/services/assignments';
import * as scheduleService from '@/services/schedule';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import { downloadExcel } from '@/lib/excel';

// ── Week utils ─────────────────────────────────────────────────────────────────
function getMonday(d: Date): Date {
  const r = new Date(d);
  const day = r.getDay();
  r.setDate(r.getDate() - (day === 0 ? 6 : day - 1));
  r.setHours(0, 0, 0, 0);
  return r;
}

// ── Status color ───────────────────────────────────────────────────────────────
const STATUS_STYLE: Record<string, string> = {
  pending:   'bg-amber-50 border-amber-300 text-amber-800',
  completed: 'bg-blue-50 border-blue-300 text-blue-700',
  approved:  'bg-green-50 border-green-300 text-green-700',
  rejected:  'bg-red-50 border-red-300 text-red-700',
};
const STATUS_LABEL: Record<string, string> = {
  pending:   'Bekliyor',
  completed: 'Tamamlandı',
  approved:  'Onaylandı',
  rejected:  'Reddedildi',
};

// ── Category display config ────────────────────────────────────────────────────
const CATEGORY_LABELS: Record<TaskCategory, string> = {
  opening:        'Açılış',
  closing:        'Kapanış',
  responsibility: 'Sorumluluk Bölgesi',
  general:        'Genel',
  special:        'Özel',
};

const CATEGORY_STYLE: Record<TaskCategory, {
  border: string; bg: string; header: string; dropOver: string;
}> = {
  opening:        { border: 'border-amber-300',  bg: 'bg-amber-50/60',  header: 'bg-amber-100 text-amber-800',    dropOver: 'ring-2 ring-amber-400 bg-amber-100' },
  closing:        { border: 'border-purple-300', bg: 'bg-purple-50/60', header: 'bg-purple-100 text-purple-800',  dropOver: 'ring-2 ring-purple-400 bg-purple-100' },
  responsibility: { border: 'border-blue-300',   bg: 'bg-blue-50/60',   header: 'bg-blue-100 text-blue-800',      dropOver: 'ring-2 ring-blue-400 bg-blue-100' },
  general:        { border: 'border-gray-300',   bg: 'bg-gray-50/60',   header: 'bg-gray-100 text-gray-700',      dropOver: 'ring-2 ring-gray-400 bg-gray-100' },
  special:        { border: 'border-rose-300',   bg: 'bg-rose-50/60',   header: 'bg-rose-100 text-rose-800',      dropOver: 'ring-2 ring-rose-400 bg-rose-100' },
};

const CATEGORY_ORDER: TaskCategory[] = ['opening', 'closing', 'responsibility', 'general', 'special'];

// ── Role icons ─────────────────────────────────────────────────────────────────
const ROLE_ICON: Record<string, string> = {
  manager:    '👑',
  supervisor: '🎯',
  employee:   '👤',
};

// ── Schedule check ─────────────────────────────────────────────────────────────
// Returns true if the task's schedule says it should recur on this date.
// 0=Mon … 6=Sun (matching backend days_of_week encoding)
function scheduleAppliesToDate(schedule: TaskSchedule | null, d: Date): boolean {
  if (!schedule) return false;
  const jsDay  = d.getDay(); // 0=Sun … 6=Sat
  const trDay  = jsDay === 0 ? 6 : jsDay - 1; // convert to 0=Mon … 6=Sun
  switch (schedule.frequency) {
    case 'daily':
    case 'multiple_daily':
    case 'interval_daily':
      return true;
    case 'weekly':
      return (schedule.days_of_week ?? []).includes(trDay);
    case 'monthly':
      return d.getDate() === schedule.month_day;
    case 'yearly':
      return d.getDate() === schedule.month_day && (d.getMonth() + 1) === schedule.month;
    default:
      return false;
  }
}

// ── Date utils ─────────────────────────────────────────────────────────────────
const TR_MONTHS = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
const TR_DAYS   = ['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'];

function toISO(d: Date): string { return d.toLocaleDateString('en-CA'); }
function addDays(d: Date, n: number): Date { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function fromISO(s: string): Date { return new Date(s + 'T12:00:00'); }
function dateLabel(d: Date): string {
  return `${TR_DAYS[d.getDay()]} ${d.getDate()} ${TR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

// ── Types ─────────────────────────────────────────────────────────────────────
// taskId → userId[]
type DayPlan = Record<number, number[]>;
// taskId → description expanded?
type ExpandedDescs = Record<number, boolean>;
// taskId → Set of userIds that are permanently assigned
type PermanentPlan = Record<number, Set<number>>;

// ── Toast ─────────────────────────────────────────────────────────────────────
interface Toast { id: number; msg: string; type: 'warn' | 'error' | 'ok' }

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AssignmentsPage() {
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');

  // ── Weekly state ─────────────────────────────────────────────────────────────
  const [weekMonday, setWeekMonday] = useState<Date>(() => getMonday(new Date()));
  const [weekData, setWeekData] = useState<Record<string, Assignment[]>>({});
  const [weekSchedules, setWeekSchedules] = useState<scheduleService.WorkScheduleEntry[]>([]);
  const [weekLoading, setWeekLoading] = useState(false);

  const [date, setDate] = useState<Date>(() => new Date());
  const [employees, setEmployees] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [plan, setPlan] = useState<DayPlan>({});
  const [permanentPlan, setPermanentPlan] = useState<PermanentPlan>({});
  const [expandedDescs, setExpandedDescs] = useState<ExpandedDescs>({});
  const [loading, setLoading] = useState(true);
  const [planLoading, setPlanLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copying, setCopying] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  // Drag state — stored in ref to avoid re-renders mid-drag
  const dragUserId   = useRef<number | null>(null);
  const dragSourceId = useRef<number | null>(null); // null = from pool
  const [dragOverId, setDragOverId] = useState<number | null>(null);

  // ── Load static data once ───────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([userService.getUsers(), taskService.getTasks()]).then(([users, allTasks]) => {
      setEmployees(users.filter(u => u.is_active));
      setTasks(allTasks);
      setLoading(false);
    });
  }, []);

  // ── Load plan when date changes ─────────────────────────────────────────────
  useEffect(() => {
    if (loading) return;
    setPlanLoading(true);
    assignmentService.getAssignments({ date: toISO(date) }).then(assignments => {
      // permanent plan always reflects the task's permanent_assignees definition
      const permPlan: PermanentPlan = {};
      for (const t of tasks) {
        if (t.permanent_assignees.length > 0) {
          permPlan[t.id] = new Set(t.permanent_assignees.map(u => u.id));
        }
      }
      setPermanentPlan(permPlan);

      const newPlan: DayPlan = {};
      if (assignments.length > 0) {
        // Real saved assignments exist for this date — use them
        for (const a of assignments) {
          if (!newPlan[a.task.id]) newPlan[a.task.id] = [];
          if (!newPlan[a.task.id].includes(a.user.id)) newPlan[a.task.id].push(a.user.id);
        }
        setDirty(false);
      } else {
        // No saved assignments — pre-populate from permanent_assignees
        // but only if the task's schedule says it recurs on this date
        for (const t of tasks) {
          if (t.permanent_assignees.length > 0 && scheduleAppliesToDate(t.schedule, date)) {
            newPlan[t.id] = t.permanent_assignees.map(u => u.id);
          }
        }
        setDirty(Object.keys(newPlan).length > 0);
      }
      setPlan(newPlan);
      setPlanLoading(false);
    });
  }, [date, loading, tasks]);

  // ── Toast helper ────────────────────────────────────────────────────────────
  function toast(msg: string, type: Toast['type'] = 'warn') {
    const id = ++toastId.current;
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4500);
  }

  // ── Plan helpers ────────────────────────────────────────────────────────────
  function getAssigned(taskId: number): User[] {
    return (plan[taskId] ?? [])
      .map(uid => employees.find(u => u.id === uid))
      .filter(Boolean) as User[];
  }

  function isAssigned(userId: number): boolean {
    return Object.values(plan).some(ids => ids.includes(userId));
  }

  function addToTask(userId: number, taskId: number) {
    const task = tasks.find(t => t.id === taskId);
    const user = employees.find(u => u.id === userId);
    if (!task || !user) return;

    // Gender guard
    if (task.allowed_genders && user.gender !== task.allowed_genders) {
      const label = task.allowed_genders === 'male' ? 'erkek' : 'kadın';
      toast(`${user.name} → "${task.title}": sadece ${label} personel atanabilir.`, 'error');
      return;
    }

    // Zone conflict warning
    if (task.zone) {
      const conflicting = tasks.find(t =>
        t.id !== taskId && t.zone && t.zone.id !== task.zone!.id &&
        (plan[t.id] ?? []).includes(userId)
      );
      if (conflicting) {
        toast(`Uyarı: ${user.name} aynı anda "${conflicting.zone!.name}" ve "${task.zone.name}" bölgelerinde atanmış.`, 'warn');
      }
    }

    if ((plan[taskId] ?? []).includes(userId)) return; // already there

    setPlan(p => ({ ...p, [taskId]: [...(p[taskId] ?? []), userId] }));
    setDirty(true);
  }

  function removeFromTask(userId: number, taskId: number) {
    setPlan(p => ({ ...p, [taskId]: (p[taskId] ?? []).filter(id => id !== userId) }));
    setDirty(true);
  }

  function assignAll(taskId: number) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const eligible = employees.filter(u => !task.allowed_genders || u.gender === task.allowed_genders);
    setPlan(p => ({
      ...p,
      [taskId]: Array.from(new Set([...(p[taskId] ?? []), ...eligible.map(u => u.id)])),
    }));
    setDirty(true);
  }

  // ── Toggle lock (permanent assignee) ────────────────────────────────────────
  async function toggleLock(userId: number, taskId: number) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const currentIds = task.permanent_assignees.map(u => u.id);
    const isLocked = currentIds.includes(userId);
    const newIds = isLocked
      ? currentIds.filter(id => id !== userId)
      : [...currentIds, userId];

    // Optimistic local update
    setPermanentPlan(p => {
      const next = { ...p };
      if (!next[taskId]) next[taskId] = new Set();
      else next[taskId] = new Set(next[taskId]);
      if (isLocked) next[taskId].delete(userId);
      else next[taskId].add(userId);
      return next;
    });

    // Persist to backend
    try {
      const updated = await taskService.setPermanentAssignees(taskId, newIds);
      // Sync tasks list so schedule-aware logic stays accurate
      setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
      const user = employees.find(u => u.id === userId);
      toast(
        isLocked
          ? `${user?.name ?? 'Personel'} kilidi kaldırıldı.`
          : `${user?.name ?? 'Personel'} bu görev için sabit atandı 🔒`,
        'ok'
      );
    } catch {
      // Revert
      setPermanentPlan(p => {
        const next = { ...p };
        next[taskId] = new Set(currentIds);
        return next;
      });
      toast('Kilit kaydedilemedi.', 'error');
    }
  }

  // ── Copy previous day ───────────────────────────────────────────────────────
  async function copyPreviousDay() {
    setCopying(true);
    try {
      const prev = await assignmentService.getPreviousDayAssignments(toISO(date));
      if (prev.length === 0) { toast('Önceki güne ait atama bulunamadı.', 'warn'); return; }
      const newPlan: DayPlan = {};
      for (const a of prev) {
        if (!newPlan[a.task.id]) newPlan[a.task.id] = [];
        if (!newPlan[a.task.id].includes(a.user.id)) newPlan[a.task.id].push(a.user.id);
      }
      setPlan(newPlan);
      setDirty(true);
      toast(`${prev.length} atama kopyalandı.`, 'ok');
    } finally {
      setCopying(false);
    }
  }

  // ── Save ────────────────────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    try {
      const items: { user_id: number; task_id: number; zone_id?: number }[] = [];
      for (const [taskIdStr, userIds] of Object.entries(plan)) {
        const taskId = Number(taskIdStr);
        const zone_id = tasks.find(t => t.id === taskId)?.zone?.id;
        for (const uid of userIds) items.push({ user_id: uid, task_id: taskId, zone_id });
      }
      const result = await assignmentService.bulkAssign(toISO(date), items);
      result.errors.forEach(e => toast(e, 'error'));
      if (result.errors.length === 0) toast(`${result.created} atama kaydedildi.`, 'ok');
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }

  function handleExport() {
    const rows: Record<string, unknown>[] = [];
    for (const [taskIdStr, userIds] of Object.entries(plan)) {
      const task = tasks.find(t => t.id === Number(taskIdStr));
      if (!task || userIds.length === 0) continue;
      for (const uid of userIds) {
        const user = employees.find(u => u.id === uid);
        rows.push({
          'Tarih': toISO(date),
          'Kategori': CATEGORY_LABELS[task.category] ?? task.category,
          'Görev': task.title,
          'Bölge': task.zone?.name ?? '',
          'Personel': user?.name ?? '',
          'Rol': user?.role ?? '',
          'Katsayı': userIds.length > 1 ? (task.coefficient / userIds.length).toFixed(2) : task.coefficient,
        });
      }
    }
    rows.sort((a, b) => String(a['Kategori']).localeCompare(String(b['Kategori']), 'tr'));
    downloadExcel([{ name: 'Atamalar', rows }], `atamalar_${toISO(date)}`);
  }

  // ── Weekly data load ────────────────────────────────────────────────────────
  const loadWeek = useCallback(async (monday: Date) => {
    setWeekLoading(true);
    const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
    const [assignmentResults, schedules] = await Promise.all([
      Promise.all(days.map(d => assignmentService.getAssignments({ date: toISO(d) }))),
      scheduleService.getWeekSchedules(toISO(monday)),
    ]);
    const map: Record<string, Assignment[]> = {};
    days.forEach((d, i) => { map[toISO(d)] = assignmentResults[i]; });
    setWeekData(map);
    setWeekSchedules(schedules);
    setWeekLoading(false);
  }, []);

  useEffect(() => {
    if (viewMode === 'weekly' && !loading) loadWeek(weekMonday);
  }, [viewMode, weekMonday, loading, loadWeek]);

  function switchToDay(d: Date) {
    setDate(d);
    setViewMode('daily');
  }

  function weeklyExport() {
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekMonday, i));
    const rows: Record<string, unknown>[] = [];
    for (const emp of employees) {
      const row: Record<string, unknown> = { 'Personel': emp.name, 'Rol': emp.role };
      for (const d of days) {
        const dateStr = toISO(d);
        const empAssignments = (weekData[dateStr] ?? []).filter(a => a.user.id === emp.id);
        row[dateStr] = empAssignments.map(a => a.task.title).join(', ');
      }
      rows.push(row);
    }
    downloadExcel([{ name: 'Haftalık', rows }], `haftalik_${toISO(weekMonday)}`);
  }

  // ── Drag handlers ───────────────────────────────────────────────────────────
  function onDragStart(e: React.DragEvent, userId: number, sourceTaskId: number | null) {
    dragUserId.current   = userId;
    dragSourceId.current = sourceTaskId;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(userId));
  }

  function onTaskDragOver(e: React.DragEvent, taskId: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverId(taskId);
  }

  function onTaskDrop(e: React.DragEvent, taskId: number) {
    e.preventDefault();
    setDragOverId(null);
    const uid = dragUserId.current;
    const src = dragSourceId.current;
    if (!uid) return;
    if (src !== null) removeFromTask(uid, src);   // moved from another task
    addToTask(uid, taskId);
    dragUserId.current = dragSourceId.current = null;
  }

  function onPoolDrop(e: React.DragEvent) {
    e.preventDefault();
    const uid = dragUserId.current;
    const src = dragSourceId.current;
    if (uid !== null && src !== null) removeFromTask(uid, src);
    dragUserId.current = dragSourceId.current = null;
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  const tasksByCategory = CATEGORY_ORDER.reduce((acc, cat) => {
    acc[cat] = tasks.filter(t => t.category === cat);
    return acc;
  }, {} as Record<TaskCategory, Task[]>);

  if (loading) return <div className="flex justify-center mt-20"><Spinner size="lg" /></div>;

  // ── Week days for weekly view ─────────────────────────────────────────────
  const TR_MONTHS_SHORT = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
  const DAY_SHORT = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekMonday, i));
  const weekEndSunday = weekDays[6];

  return (
    <div className="flex flex-col h-full gap-3 overflow-hidden">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
        <h1 className="text-xl font-bold whitespace-nowrap">
          {viewMode === 'daily' ? 'Günlük Operasyon Paneli' : 'Haftalık Atama Tablosu'}
        </h1>

        {/* View toggle */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-semibold">
          <button
            onClick={() => setViewMode('daily')}
            className={`px-3 py-1.5 transition-colors ${viewMode === 'daily' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
          >
            Günlük
          </button>
          <button
            onClick={() => setViewMode('weekly')}
            className={`px-3 py-1.5 transition-colors ${viewMode === 'weekly' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
          >
            Haftalık
          </button>
        </div>

        {/* Date/week nav */}
        {viewMode === 'daily' ? (
          <div className="flex items-center gap-1">
            <button onClick={() => setDate(d => addDays(d, -1))} className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 text-lg">←</button>
            <span className="px-3 py-1.5 text-sm font-semibold bg-white border border-gray-200 rounded-lg min-w-[180px] text-center">
              {dateLabel(date)}
            </span>
            <button onClick={() => setDate(d => addDays(d, 1))} className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 text-lg">→</button>
            <button onClick={() => setDate(new Date())} className="ml-1 px-2 py-1 text-xs rounded hover:bg-gray-100 text-gray-500 border border-gray-200">Bugün</button>
            <input
              type="date"
              value={toISO(date)}
              onChange={e => e.target.value && setDate(fromISO(e.target.value))}
              className="ml-1 border border-gray-200 rounded px-2 py-1 text-xs text-gray-600"
            />
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <button onClick={() => setWeekMonday(m => getMonday(addDays(m, -7)))} className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 text-lg">←</button>
            <span className="px-3 py-1.5 text-sm font-semibold bg-white border border-gray-200 rounded-lg min-w-[210px] text-center">
              {weekMonday.getDate()} {TR_MONTHS_SHORT[weekMonday.getMonth()]} – {weekEndSunday.getDate()} {TR_MONTHS_SHORT[weekEndSunday.getMonth()]} {weekEndSunday.getFullYear()}
            </span>
            <button onClick={() => setWeekMonday(m => getMonday(addDays(m, 7)))} className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 text-lg">→</button>
            <button onClick={() => setWeekMonday(getMonday(new Date()))} className="ml-1 px-2 py-1 text-xs rounded hover:bg-gray-100 text-gray-500 border border-gray-200">Bu Hafta</button>
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto">
          {viewMode === 'daily' ? (
            <>
              {dirty && (
                <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
                  Kaydedilmemiş
                </span>
              )}
              <Button variant="secondary" size="sm" isLoading={copying} onClick={copyPreviousDay}>
                ↩ Dünü Kopyala
              </Button>
              <Button variant="secondary" size="sm" onClick={handleExport}>⬇ Excel</Button>
              <Button size="sm" isLoading={saving} onClick={handleSave}>
                {dirty ? 'Kaydet ●' : 'Kaydet'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" size="sm" onClick={() => loadWeek(weekMonday)}>↺ Yenile</Button>
              <Button variant="secondary" size="sm" onClick={weeklyExport}>⬇ Excel</Button>
            </>
          )}
        </div>
      </div>

      {/* ── Legend (daily only) ── */}
      {viewMode === 'daily' && (
        <div className="flex items-center gap-4 text-xs text-gray-400 -mt-1 flex-shrink-0">
          <span>🔓 kilitle → <span className="text-indigo-600 font-medium">🔒 sabit atama</span> (görevin tekrar gününde otomatik gelir)</span>
          <span className="text-gray-300">|</span>
          <span>Kilit sadece tekrarlayan görevlerde görünür</span>
        </div>
      )}

      {/* ── Toasts ── */}
      {toasts.length > 0 && (
        <div className="flex flex-col gap-1.5 fixed bottom-6 right-6 z-50 w-80">
          {toasts.map(t => (
            <div
              key={t.id}
              className={`flex items-start gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all
                ${t.type === 'error' ? 'bg-red-600 text-white' :
                  t.type === 'ok'    ? 'bg-green-600 text-white' :
                                       'bg-amber-500 text-white'}`}
            >
              <span>{t.type === 'error' ? '✕' : t.type === 'ok' ? '✓' : '⚠'}</span>
              <span>{t.msg}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Weekly table ── */}
      {viewMode === 'weekly' && (
        <div className="flex-1 overflow-auto">
          {weekLoading ? (
            <div className="flex justify-center py-20"><Spinner size="lg" /></div>
          ) : (
            <>
              {/* Legend */}
              <div className="flex items-center gap-3 mb-3 text-[11px] text-gray-400 flex-wrap">
                {Object.entries(STATUS_LABEL).map(([k, v]) => (
                  <span key={k} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium ${STATUS_STYLE[k]}`}>{v}</span>
                ))}
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium bg-green-100 border-green-300 text-green-700`}>İzin (OFF)</span>
                <span className="text-gray-300 ml-2">· Güne tıklayarak düzenleme moduna geçin</span>
              </div>

              <div className="overflow-x-auto rounded-xl shadow border border-gray-200 bg-white">
                <table className="min-w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-800 text-white">
                      <th className="sticky left-0 bg-gray-800 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider w-40 z-10">
                        Personel
                      </th>
                      {weekDays.map((d, i) => {
                        const isToday = toISO(d) === toISO(new Date());
                        return (
                          <th
                            key={i}
                            onClick={() => switchToDay(d)}
                            className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[160px] cursor-pointer hover:bg-gray-700 transition-colors"
                          >
                            <div className={isToday ? 'text-indigo-300' : ''}>{DAY_SHORT[i]}</div>
                            <div className={`font-normal text-[10px] ${isToday ? 'text-indigo-400' : 'text-gray-400'}`}>
                              {d.getDate()} {TR_MONTHS_SHORT[d.getMonth()]}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp, ri) => {
                      const rowBg = (['bg-white', 'bg-[#f3f4f6]', 'bg-[#e5e7eb]'] as const)[ri % 3];
                      return (
                        <tr key={emp.id} className={rowBg}>
                          <td className={`sticky left-0 z-10 px-4 py-3 border-r border-[#d1d5db] ${rowBg}`}>
                            <div className="font-bold text-sm text-gray-900">{emp.name}</div>
                            <div className="text-[10px] text-gray-500 mt-0.5">
                              {emp.role === 'manager' ? 'Yönetici' : emp.role === 'supervisor' ? 'Şef' : 'Personel'}
                            </div>
                          </td>
                          {weekDays.map((d, di) => {
                            const dateStr = toISO(d);
                            const sched = weekSchedules.find(s => s.user_id === emp.id && s.date === dateStr);
                            const isOff = sched?.is_off === true;
                            const shiftTime = !isOff && sched?.start_time
                              ? `${sched.start_time.slice(0,5).replace(':','.')}–${sched.end_time?.slice(0,5).replace(':','.')}`
                              : null;
                            const dayAssignments = (weekData[dateStr] ?? []).filter(a => a.user.id === emp.id);

                            return (
                              <td
                                key={di}
                                onClick={() => switchToDay(d)}
                                className={`border border-[#d1d5db] px-2 py-2 cursor-pointer hover:bg-[#e0f2fe] transition-colors align-top min-h-[60px] ${isOff ? 'bg-green-50' : ''}`}
                              >
                                {isOff ? (
                                  <div className="flex flex-col gap-1">
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-green-100 border border-green-300 text-green-700 w-fit">
                                      🌿 İzin
                                    </span>
                                    {dayAssignments.length > 0 && (
                                      <span className="text-[9px] text-amber-600 font-medium">⚠ {dayAssignments.length} atama var</span>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex flex-col gap-1.5">
                                    {shiftTime && (
                                      <div className="text-[9px] text-gray-400 font-medium mb-0.5">🕐 {shiftTime}</div>
                                    )}
                                    {dayAssignments.length === 0 ? (
                                      <span className="text-gray-200 text-xs">—</span>
                                    ) : (
                                      dayAssignments.map(a => (
                                        <div
                                          key={a.id}
                                          className={`rounded-lg border px-2 py-1 ${STATUS_STYLE[a.status] ?? STATUS_STYLE.pending}`}
                                        >
                                          <div className="text-[11px] font-semibold leading-tight">{a.task.title}</div>
                                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                            {a.task.zone && (
                                              <span className="text-[9px] opacity-70">📍{a.task.zone.name}</span>
                                            )}
                                            {a.shift && (
                                              <span className="text-[9px] opacity-70">⏱{a.shift.name}</span>
                                            )}
                                            <span className={`text-[9px] font-bold ml-auto ${
                                              a.status === 'approved' ? 'text-green-600' :
                                              a.status === 'rejected' ? 'text-red-500' :
                                              a.status === 'completed' ? 'text-blue-500' : 'text-amber-500'
                                            }`}>
                                              {STATUS_LABEL[a.status] ?? a.status}
                                            </span>
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                    {employees.length === 0 && (
                      <tr>
                        <td colSpan={8} className="text-center py-10 text-gray-400">Aktif personel bulunamadı.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                <div className="flex gap-3">
                  <span>{weekSchedules.filter(s => s.is_off).length} kişi·gün izin</span>
                  <span>{Object.values(weekData).flat().length} toplam atama</span>
                </div>
                <span>· Sütun başlığına tıklayarak o günü düzenleyin</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Main layout (daily) ── */}
      {viewMode === 'daily' && <div className="flex gap-4 flex-1 min-h-0">

        {/* ── Staff Pool ── */}
        <div
          className="w-48 flex-shrink-0 flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden self-start sticky top-0 max-h-[calc(100vh-160px)]"
          onDragOver={e => e.preventDefault()}
          onDrop={onPoolDrop}
        >
          <div className="px-3 py-2.5 border-b border-gray-100 bg-gray-50">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Personel</p>
            <p className="text-[10px] text-gray-400">{employees.length} aktif</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5">
            {employees.map(u => {
              const assigned = isAssigned(u.id);
              return (
                <div
                  key={u.id}
                  draggable
                  onDragStart={e => onDragStart(e, u.id, null)}
                  onDragEnd={() => { dragUserId.current = dragSourceId.current = null; setDragOverId(null); }}
                  className={`
                    px-2.5 py-2 rounded-lg cursor-grab active:cursor-grabbing select-none
                    border text-xs font-medium transition-all
                    ${assigned
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'}
                  `}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm leading-none">{ROLE_ICON[u.role] ?? '👤'}</span>
                    <span className="truncate">{u.name}</span>
                  </div>
                  {assigned && <div className="text-[9px] text-indigo-400 mt-0.5 pl-5">atanmış ✓</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Task Board ── */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-1 pb-4">
          {planLoading && (
            <div className="flex justify-center py-10"><Spinner size="lg" /></div>
          )}
          {!planLoading && CATEGORY_ORDER.map(cat => {
            const catTasks = tasksByCategory[cat];
            if (!catTasks || catTasks.length === 0) return null;
            const sty = CATEGORY_STYLE[cat];
            return (
              <section key={cat} className={`rounded-xl border-2 ${sty.border} flex-shrink-0`}>
                {/* Category header */}
                <div className={`px-4 py-2 ${sty.header} flex items-center justify-between`}>
                  <span className="text-sm font-bold tracking-wide">{CATEGORY_LABELS[cat]}</span>
                  <span className="text-xs opacity-60">{catTasks.length} görev</span>
                </div>

                {/* Task slots */}
                <div className="p-3 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                  {catTasks.map(task => {
                    const assigned = getAssigned(task.id);
                    const isOver = dragOverId === task.id;
                    const assigneeCount = assigned.length;
                    const coeffShare = assigneeCount > 1
                      ? (task.coefficient / assigneeCount).toFixed(2)
                      : null;
                    return (
                      <div
                        key={task.id}
                        className={`
                          rounded-lg border-2 p-2.5 flex flex-col gap-2 transition-all
                          ${isOver ? sty.dropOver : `${sty.border} ${sty.bg}`}
                        `}
                        onDragOver={e => onTaskDragOver(e, task.id)}
                        onDragLeave={() => setDragOverId(null)}
                        onDrop={e => onTaskDrop(e, task.id)}
                      >
                        {/* Task name + zone + coefficient */}
                        <div className="flex items-start justify-between gap-1">
                          <button
                            className="text-xs font-semibold text-gray-800 leading-snug text-left hover:text-indigo-700 transition-colors min-w-0 break-words"
                            title={task.description || undefined}
                            onClick={() => task.description && setExpandedDescs(e => ({ ...e, [task.id]: !e[task.id] }))}
                          >
                            {task.title}
                            {task.description && (
                              <span className="ml-1 text-[9px] text-gray-400 font-normal">
                                {expandedDescs[task.id] ? '▲' : '▼'}
                              </span>
                            )}
                          </button>
                          <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                            {task.zone && (
                              <span className="text-[9px] text-gray-400">{task.zone.name}</span>
                            )}
                            {coeffShare ? (
                              <span className="text-[9px] text-indigo-500 font-medium">
                                k:{coeffShare}×{assigneeCount}
                              </span>
                            ) : task.coefficient > 1 ? (
                              <span className="text-[9px] text-gray-400">k:{task.coefficient}</span>
                            ) : null}
                          </div>
                        </div>

                        {/* Description (expandable) */}
                        {task.description && expandedDescs[task.id] && (
                          <p className="text-[10px] text-gray-500 leading-relaxed bg-white/70 rounded px-1.5 py-1 -mt-1 border border-gray-200">
                            {task.description}
                          </p>
                        )}

                        {/* Assigned badges */}
                        <div className="flex flex-col gap-1 flex-1">
                          {assigned.length === 0 ? (
                            <span className={`text-[10px] italic ${isOver ? 'text-indigo-500 font-medium' : 'text-gray-400'}`}>
                              {isOver ? 'Bırak ↓' : 'Sürükle...'}
                            </span>
                          ) : (
                            assigned.map(u => {
                              const isLocked = permanentPlan[task.id]?.has(u.id) ?? false;
                              const hasSchedule = !!task.schedule;
                              return (
                                <span
                                  key={u.id}
                                  draggable
                                  title={u.name}
                                  onDragStart={e => onDragStart(e, u.id, task.id)}
                                  onDragEnd={() => { dragUserId.current = dragSourceId.current = null; setDragOverId(null); }}
                                  className={`inline-flex items-center gap-1 text-[11px] rounded-full pl-1.5 pr-1 py-0.5 font-medium shadow-sm cursor-grab active:cursor-grabbing border w-full
                                    ${isLocked
                                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                                      : 'bg-white border-gray-200 text-gray-700'}`}
                                >
                                  <span className="leading-none shrink-0">{ROLE_ICON[u.role] ?? '👤'}</span>
                                  <span className="truncate">{u.name}</span>
                                  {/* Lock toggle — only shown if task has a schedule */}
                                  {hasSchedule && (
                                    <button
                                      title={isLocked ? 'Kilidi kaldır' : 'Sabit ata (tekrar günlerinde otomatik gelir)'}
                                      onMouseDown={e => e.stopPropagation()}
                                      onClick={() => toggleLock(u.id, task.id)}
                                      className="ml-0.5 text-[11px] hover:scale-110 transition-transform leading-none"
                                    >
                                      {isLocked ? '🔒' : '🔓'}
                                    </button>
                                  )}
                                  <button
                                    onMouseDown={e => e.stopPropagation()}
                                    onClick={() => removeFromTask(u.id, task.id)}
                                    className="text-gray-300 hover:text-red-500 transition-colors leading-none ml-0.5"
                                  >
                                    ×
                                  </button>
                                </span>
                              );
                            })
                          )}
                        </div>

                        {/* Assign all — only for general / special */}
                        {(cat === 'general' || cat === 'special') && (
                          <button
                            onClick={() => assignAll(task.id)}
                            className="text-[10px] text-gray-400 hover:text-indigo-600 text-left transition-colors mt-auto"
                          >
                            + Herkesi ata
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}

          {tasks.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
              <p className="text-sm">Henüz görev oluşturulmamış.</p>
              <p className="text-xs">Görevler sayfasından görev ekleyin.</p>
            </div>
          )}
        </div>
      </div>}
    </div>
  );
}
