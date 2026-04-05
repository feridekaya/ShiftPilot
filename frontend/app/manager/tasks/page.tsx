'use client';

import { useEffect, useMemo, useState } from 'react';
import { Task, Zone, Role, TaskSchedule, Frequency, TaskCategory } from '@/types';
import * as taskService from '@/services/tasks';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { AxiosError } from 'axios';

const ALL_ROLES: Role[] = ['manager', 'supervisor', 'employee'];
const roleLabel: Record<Role, string> = { manager: 'Yönetici', supervisor: 'Şef', employee: 'Personel' };
const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

const CATEGORIES: { value: TaskCategory; label: string }[] = [
  { value: 'opening',        label: 'Açılış' },
  { value: 'closing',        label: 'Kapanış' },
  { value: 'responsibility', label: 'Sorumluluk Bölgesi' },
  { value: 'general',        label: 'Genel' },
  { value: 'special',        label: 'Özel' },
];

const categoryLabel: Record<TaskCategory, string> = {
  opening: 'Açılış',
  closing: 'Kapanış',
  responsibility: 'Sorumluluk Bölgesi',
  general: 'Genel',
  special: 'Özel',
};

const categoryColor: Record<TaskCategory, string> = {
  opening:        'bg-amber-100 text-amber-800',
  closing:        'bg-purple-100 text-purple-800',
  responsibility: 'bg-blue-100 text-blue-800',
  general:        'bg-gray-100 text-gray-700',
  special:        'bg-rose-100 text-rose-800',
};

const freqLabel: Record<Frequency, string> = {
  multiple_daily: 'Günde birden fazla',
  interval_daily: 'Her X saatte bir',
  daily:          'Her gün',
  weekly:         'Haftada',
  monthly:        'Ayda bir',
  yearly:         'Yılda bir',
};

type SortKey = 'title' | 'category' | 'zone';
type SortDir = 'asc' | 'desc';

const emptyForm = {
  title: '',
  description: '',
  category: 'general' as TaskCategory,
  zone_id: 0,
  requires_photo: true,
  coefficient: 1,
  allowed_roles: ['employee'] as Role[],
  allowed_genders: '',
};

type ScheduleForm = {
  enabled: boolean;
  frequency: Frequency;
  times_per_day: number;
  interval_hours: number;
  days_of_week: number[];
  month_day: number;
  month: number;
};

const emptySchedule: ScheduleForm = {
  enabled: false,
  frequency: 'daily',
  times_per_day: 2,
  interval_hours: 2,
  days_of_week: [],
  month_day: 1,
  month: 1,
};

function scheduleToLabel(s: TaskSchedule | null): string {
  if (!s) return '—';
  switch (s.frequency) {
    case 'multiple_daily':  return `Günde ${s.times_per_day} kez`;
    case 'interval_daily':  return `Her ${s.interval_hours} saatte bir`;
    case 'daily':           return 'Her gün';
    case 'weekly':          return `Haftalık (${s.days_of_week.map(d => DAYS[d]).join(', ')})`;
    case 'monthly':         return `Her ayın ${s.month_day}. günü`;
    case 'yearly':          return `Her yıl ${s.month_day} ${MONTHS[(s.month ?? 1) - 1]}`;
    default:                return '—';
  }
}

export default function TasksPage() {
  const [tasks, setTasks]           = useState<Task[]>([]);
  const [zones, setZones]           = useState<Zone[]>([]);
  const [isOpen, setIsOpen]         = useState(false);
  const [editing, setEditing]       = useState<Task | null>(null);
  const [form, setForm]             = useState(emptyForm);
  const [scheduleForm, setScheduleForm] = useState<ScheduleForm>(emptySchedule);
  const [error, setError]           = useState('');
  const [saving, setSaving]         = useState(false);

  // ── Filters / Sort ──────────────────────────────────────────────────────────
  const [search, setSearch]           = useState('');
  const [filterCategory, setFilterCategory] = useState<TaskCategory | ''>('');
  const [sortKey, setSortKey]         = useState<SortKey>('title');
  const [sortDir, setSortDir]         = useState<SortDir>('asc');

  useEffect(() => {
    taskService.getTasks().then(setTasks);
    taskService.getZones().then(setZones);
  }, []);

  const displayed = useMemo(() => {
    let list = [...tasks];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t => t.title.toLowerCase().includes(q));
    }
    if (filterCategory) {
      list = list.filter(t => t.category === filterCategory);
    }
    list.sort((a, b) => {
      let va = '', vb = '';
      if (sortKey === 'title')    { va = a.title;               vb = b.title; }
      if (sortKey === 'category') { va = categoryLabel[a.category]; vb = categoryLabel[b.category]; }
      if (sortKey === 'zone')     { va = a.zone?.name ?? '';    vb = b.zone?.name ?? ''; }
      return sortDir === 'asc' ? va.localeCompare(vb, 'tr') : vb.localeCompare(va, 'tr');
    });
    return list;
  }, [tasks, search, filterCategory, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  }

  function sortIcon(key: SortKey) {
    if (sortKey !== key) return <span className="text-gray-300 ml-1">↕</span>;
    return <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  }

  // ── Form helpers ────────────────────────────────────────────────────────────
  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setScheduleForm(emptySchedule);
    setError('');
    setIsOpen(true);
  }

  function openEdit(t: Task) {
    setEditing(t);
    setForm({
      title: t.title,
      description: t.description,
      category: t.category,
      zone_id: t.zone?.id ?? 0,
      requires_photo: t.requires_photo,
      coefficient: t.coefficient,
      allowed_roles: t.allowed_roles,
      allowed_genders: t.allowed_genders ?? '',
    });
    if (t.schedule) {
      setScheduleForm({
        enabled: true,
        frequency: t.schedule.frequency,
        times_per_day: t.schedule.times_per_day ?? 2,
        interval_hours: t.schedule.interval_hours ?? 2,
        days_of_week: t.schedule.days_of_week ?? [],
        month_day: t.schedule.month_day ?? 1,
        month: t.schedule.month ?? 1,
      });
    } else {
      setScheduleForm(emptySchedule);
    }
    setError('');
    setIsOpen(true);
  }

  function toggleRole(role: Role) {
    setForm(f => ({
      ...f,
      allowed_roles: f.allowed_roles.includes(role)
        ? f.allowed_roles.filter(r => r !== role)
        : [...f.allowed_roles, role],
    }));
  }

  function toggleDay(d: number) {
    setScheduleForm(f => ({
      ...f,
      days_of_week: f.days_of_week.includes(d)
        ? f.days_of_week.filter(x => x !== d)
        : [...f.days_of_week, d],
    }));
  }

  async function saveSchedule(taskId: number, existingSchedule: TaskSchedule | null) {
    if (!scheduleForm.enabled) {
      if (existingSchedule) await taskService.deleteSchedule(existingSchedule.id);
      return;
    }
    const payload: taskService.SchedulePayload = {
      task_id: taskId,
      frequency: scheduleForm.frequency,
      times_per_day: scheduleForm.frequency === 'multiple_daily' ? scheduleForm.times_per_day : 1,
      interval_hours: scheduleForm.frequency === 'interval_daily' ? scheduleForm.interval_hours : null,
      days_of_week: scheduleForm.frequency === 'weekly' ? scheduleForm.days_of_week : [],
      month_day: ['monthly', 'yearly'].includes(scheduleForm.frequency) ? scheduleForm.month_day : null,
      month: scheduleForm.frequency === 'yearly' ? scheduleForm.month : null,
    };
    if (existingSchedule) {
      await taskService.updateSchedule(existingSchedule.id, payload);
    } else {
      await taskService.createSchedule(payload);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = { ...form, allowed_genders: form.allowed_genders || undefined };
      if (editing) {
        const updated = await taskService.updateTask(editing.id, payload);
        await saveSchedule(updated.id, editing.schedule);
        setTasks(await taskService.getTasks());
      } else {
        const created = await taskService.createTask(payload);
        await saveSchedule(created.id, null);
        setTasks(await taskService.getTasks());
      }
      setIsOpen(false);
    } catch (err) {
      const e = err as AxiosError<Record<string, string[]>>;
      setError(Object.values(e.response?.data ?? {}).flat().join(' ') || 'Hata oluştu.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(t: Task) {
    if (!confirm(`"${t.title}" silinsin mi?`)) return;
    await taskService.deleteTask(t.id);
    setTasks(tasks.filter(x => x.id !== t.id));
  }

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Görevler</h1>
        <Button onClick={openCreate}>+ Yeni Görev</Button>
      </div>

      {/* ── Filter bar ── */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          placeholder="Görev ara..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 w-52"
        />
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value as TaskCategory | '')}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">Tüm kategoriler</option>
          {CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <span className="text-xs text-gray-400 self-center ml-1">{displayed.length} görev</span>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              <th
                className="px-4 py-3 text-left cursor-pointer select-none hover:text-indigo-600"
                onClick={() => toggleSort('title')}
              >
                Başlık {sortIcon('title')}
              </th>
              <th
                className="px-4 py-3 text-left cursor-pointer select-none hover:text-indigo-600"
                onClick={() => toggleSort('category')}
              >
                Kategori {sortIcon('category')}
              </th>
              <th
                className="px-4 py-3 text-left cursor-pointer select-none hover:text-indigo-600"
                onClick={() => toggleSort('zone')}
              >
                Bölge {sortIcon('zone')}
              </th>
              <th className="px-4 py-3 text-left">Açıklama</th>
              {['Katsayı', 'Fotoğraf', 'Tekrarlama', 'Roller', 'İşlemler'].map(h => (
                <th key={h} className="px-4 py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {displayed.map(t => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{t.title}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryColor[t.category]}`}>
                    {categoryLabel[t.category]}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{t.zone?.name ?? '-'}</td>
                <td className="px-4 py-3 text-gray-500 text-xs max-w-[200px]">
                  {t.description
                    ? <span title={t.description}>{t.description.length > 80 ? t.description.slice(0, 80) + '…' : t.description}</span>
                    : <span className="text-gray-300 italic">—</span>}
                </td>
                <td className="px-4 py-3">{t.coefficient}</td>
                <td className="px-4 py-3">{t.requires_photo ? 'Evet' : 'Hayır'}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">{scheduleToLabel(t.schedule)}</td>
                <td className="px-4 py-3 text-gray-600">{t.allowed_roles.map(r => roleLabel[r]).join(', ')}</td>
                <td className="px-4 py-3 flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => openEdit(t)}>Düzenle</Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(t)}>Sil</Button>
                </td>
              </tr>
            ))}
            {displayed.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-10 text-gray-400">Görev bulunamadı.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modal ── */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editing ? 'Görevi Düzenle' : 'Yeni Görev'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}

          <Input label="Başlık" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
          <Input label="Açıklama" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />

          {/* Category */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Kategori</label>
            <select
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value as TaskCategory })}
            >
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          {/* Zone */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Bölge</label>
            <select
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              value={form.zone_id}
              onChange={e => setForm({ ...form, zone_id: Number(e.target.value) })}
              required
            >
              <option value={0} disabled>Bölge seç...</option>
              {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
          </div>

          <Input
            label="Katsayı (min 1)"
            type="number"
            min={1}
            value={form.coefficient}
            onChange={e => setForm({ ...form, coefficient: Number(e.target.value) })}
            required
          />

          {/* Roles */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">İzin Verilen Roller</label>
            {ALL_ROLES.map(r => (
              <label key={r} className="flex items-center gap-2 text-sm mb-1">
                <input type="checkbox" checked={form.allowed_roles.includes(r)} onChange={() => toggleRole(r)} />
                {roleLabel[r]}
              </label>
            ))}
          </div>

          {/* Gender */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Cinsiyet Kısıtı</label>
            <select
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              value={form.allowed_genders}
              onChange={e => setForm({ ...form, allowed_genders: e.target.value })}
            >
              <option value="">Hepsi</option>
              <option value="male">Erkek</option>
              <option value="female">Kadın</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.requires_photo} onChange={e => setForm({ ...form, requires_photo: e.target.checked })} />
            Fotoğraf zorunlu
          </label>

          {/* ── Schedule ── */}
          <div className="border-t pt-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
              <input
                type="checkbox"
                checked={scheduleForm.enabled}
                onChange={e => setScheduleForm(f => ({ ...f, enabled: e.target.checked }))}
              />
              Tekrarlayan Görev
            </label>

            {scheduleForm.enabled && (
              <div className="flex flex-col gap-3 pl-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-600">Tekrarlama Sıklığı</label>
                  <select
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={scheduleForm.frequency}
                    onChange={e => setScheduleForm(f => ({ ...f, frequency: e.target.value as Frequency, days_of_week: [] }))}
                  >
                    {(Object.keys(freqLabel) as Frequency[]).map(f => (
                      <option key={f} value={f}>{freqLabel[f]}</option>
                    ))}
                  </select>
                </div>

                {/* Günde N kez */}
                {scheduleForm.frequency === 'multiple_daily' && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600">Günde</span>
                    <input
                      type="number"
                      min={2}
                      max={24}
                      className="w-16 rounded-md border border-gray-300 px-2 py-1 text-sm text-center"
                      value={scheduleForm.times_per_day}
                      onChange={e => setScheduleForm(f => ({ ...f, times_per_day: Number(e.target.value) }))}
                    />
                    <span className="text-gray-600">kez</span>
                  </div>
                )}

                {/* Her X saatte bir */}
                {scheduleForm.frequency === 'interval_daily' && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600">Her</span>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      className="w-16 rounded-md border border-gray-300 px-2 py-1 text-sm text-center"
                      value={scheduleForm.interval_hours}
                      onChange={e => setScheduleForm(f => ({ ...f, interval_hours: Number(e.target.value) }))}
                    />
                    <span className="text-gray-600">saatte bir</span>
                  </div>
                )}

                {/* Weekly day picker */}
                {scheduleForm.frequency === 'weekly' && (
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Hangi günler?</p>
                    <div className="flex gap-1 flex-wrap">
                      {DAYS.map((d, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => toggleDay(i)}
                          className={`px-2 py-1 rounded text-xs font-medium border transition-colors ${
                            scheduleForm.days_of_week.includes(i)
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Monthly/Yearly day */}
                {(scheduleForm.frequency === 'monthly' || scheduleForm.frequency === 'yearly') && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600">Her ayın</span>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      className="w-16 rounded-md border border-gray-300 px-2 py-1 text-sm text-center"
                      value={scheduleForm.month_day}
                      onChange={e => setScheduleForm(f => ({ ...f, month_day: Number(e.target.value) }))}
                    />
                    <span className="text-gray-600">. günü</span>
                  </div>
                )}

                {/* Yearly month */}
                {scheduleForm.frequency === 'yearly' && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600">Ay:</span>
                    <select
                      className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                      value={scheduleForm.month}
                      onChange={e => setScheduleForm(f => ({ ...f, month: Number(e.target.value) }))}
                    >
                      {MONTHS.map((m, i) => (
                        <option key={i + 1} value={i + 1}>{m}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <Button variant="secondary" type="button" onClick={() => setIsOpen(false)}>İptal</Button>
            <Button type="submit" isLoading={saving}>Kaydet</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
