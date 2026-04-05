'use client';

import { useEffect, useRef, useState } from 'react';
import { User, Task, TaskCategory } from '@/types';
import * as userService from '@/services/users';
import * as taskService from '@/services/tasks';
import * as assignmentService from '@/services/assignments';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';

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

// ── Toast ─────────────────────────────────────────────────────────────────────
interface Toast { id: number; msg: string; type: 'warn' | 'error' | 'ok' }

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AssignmentsPage() {
  const [date, setDate] = useState<Date>(() => new Date());
  const [employees, setEmployees] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [plan, setPlan] = useState<DayPlan>({});
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
      const newPlan: DayPlan = {};
      for (const a of assignments) {
        if (!newPlan[a.task.id]) newPlan[a.task.id] = [];
        if (!newPlan[a.task.id].includes(a.user.id)) newPlan[a.task.id].push(a.user.id);
      }
      setPlan(newPlan);
      setDirty(false);
      setPlanLoading(false);
    });
  }, [date, loading]);

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
      [taskId]: [...new Set([...(p[taskId] ?? []), ...eligible.map(u => u.id)])],
    }));
    setDirty(true);
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

  return (
    <div className="flex flex-col h-full gap-4">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold whitespace-nowrap">Günlük Operasyon Paneli</h1>

        {/* Date nav */}
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

        <div className="flex items-center gap-2 ml-auto">
          {dirty && (
            <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
              Kaydedilmemiş
            </span>
          )}
          <Button variant="secondary" size="sm" isLoading={copying} onClick={copyPreviousDay}>
            ↩ Dünü Kopyala
          </Button>
          <Button size="sm" isLoading={saving} onClick={handleSave}>
            {dirty ? 'Kaydet ●' : 'Kaydet'}
          </Button>
        </div>
      </div>

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

      {/* ── Main layout ── */}
      <div className="flex gap-4 flex-1 min-h-0 overflow-hidden">

        {/* ── Staff Pool ── */}
        <div
          className="w-40 flex-shrink-0 flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
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
                    px-2.5 py-1.5 rounded-lg cursor-grab active:cursor-grabbing select-none
                    border text-xs font-medium transition-all
                    ${assigned
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'}
                  `}
                >
                  <div className="truncate">{u.name}</div>
                  {assigned && <div className="text-[9px] text-indigo-400 mt-0.5">atanmış ✓</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Task Board ── */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-1">
          {planLoading && (
            <div className="flex justify-center py-10"><Spinner size="lg" /></div>
          )}
          {!planLoading && CATEGORY_ORDER.map(cat => {
            const catTasks = tasksByCategory[cat];
            if (!catTasks || catTasks.length === 0) return null;
            const sty = CATEGORY_STYLE[cat];
            return (
              <section key={cat} className={`rounded-xl border-2 ${sty.border} overflow-hidden`}>
                {/* Category header */}
                <div className={`px-4 py-2 ${sty.header} flex items-center justify-between`}>
                  <span className="text-sm font-bold tracking-wide">{CATEGORY_LABELS[cat]}</span>
                  <span className="text-xs opacity-60">{catTasks.length} görev</span>
                </div>

                {/* Task slots */}
                <div className="p-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {catTasks.map(task => {
                    const assigned = getAssigned(task.id);
                    const isOver = dragOverId === task.id;
                    return (
                      <div
                        key={task.id}
                        className={`
                          rounded-lg border-2 p-2.5 flex flex-col gap-2 min-h-[90px] transition-all
                          ${isOver ? sty.dropOver : `${sty.border} ${sty.bg}`}
                        `}
                        onDragOver={e => onTaskDragOver(e, task.id)}
                        onDragLeave={() => setDragOverId(null)}
                        onDrop={e => onTaskDrop(e, task.id)}
                      >
                        {/* Task name + zone */}
                        <div className="flex items-start justify-between gap-1">
                          <p className="text-xs font-semibold text-gray-800 leading-snug">{task.title}</p>
                          {task.zone && (
                            <span className="text-[9px] text-gray-400 flex-shrink-0 mt-0.5">{task.zone.name}</span>
                          )}
                        </div>

                        {/* Assigned badges */}
                        <div className="flex flex-wrap gap-1 flex-1">
                          {assigned.length === 0 ? (
                            <span className={`text-[10px] italic ${isOver ? 'text-indigo-500 font-medium' : 'text-gray-400'}`}>
                              {isOver ? 'Bırak ↓' : 'Sürükle...'}
                            </span>
                          ) : (
                            assigned.map(u => (
                              <span
                                key={u.id}
                                draggable
                                onDragStart={e => onDragStart(e, u.id, task.id)}
                                onDragEnd={() => { dragUserId.current = dragSourceId.current = null; setDragOverId(null); }}
                                className="inline-flex items-center gap-1 text-[11px] bg-white border border-gray-200 rounded-full px-2 py-0.5 font-medium text-gray-700 shadow-sm cursor-grab active:cursor-grabbing"
                              >
                                {u.name.split(' ')[0]}
                                <button
                                  onMouseDown={e => e.stopPropagation()}
                                  onClick={() => removeFromTask(u.id, task.id)}
                                  className="text-gray-300 hover:text-red-500 transition-colors leading-none ml-0.5"
                                >
                                  ×
                                </button>
                              </span>
                            ))
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
      </div>
    </div>
  );
}
