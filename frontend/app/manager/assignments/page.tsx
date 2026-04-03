'use client';

import { useEffect, useState } from 'react';
import { Assignment, User, Task, Zone, Shift } from '@/types';
import * as assignmentService from '@/services/assignments';
import * as userService from '@/services/users';
import * as taskService from '@/services/tasks';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { AxiosError } from 'axios';

const emptyForm = { user_id: 0, task_id: 0, shift_id: 0, zone_id: 0, date: '' };

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Assignment | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [filterDate, setFilterDate] = useState('');
  const [filterUser, setFilterUser] = useState(0);

  useEffect(() => {
    assignmentService.getAssignments().then(setAssignments);
    userService.getUsers().then(all => setEmployees(all.filter(u => u.role === 'employee')));
    taskService.getTasks().then(setTasks);
    taskService.getZones().then(setZones);
    taskService.getShifts().then(setShifts);
  }, []);

  const filtered = assignments.filter(a => {
    if (filterDate && a.date !== filterDate) return false;
    if (filterUser && a.user.id !== filterUser) return false;
    return true;
  });

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setIsOpen(true);
  }

  function openEdit(a: Assignment) {
    setEditing(a);
    setForm({
      user_id: a.user.id,
      task_id: a.task.id,
      shift_id: a.shift?.id ?? 0,
      zone_id: a.zone?.id ?? 0,
      date: a.date,
    });
    setError('');
    setIsOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (editing) {
        const updated = await assignmentService.updateAssignment(editing.id, form);
        setAssignments(assignments.map(a => a.id === updated.id ? updated : a));
      } else {
        const created = await assignmentService.createAssignment(form);
        setAssignments([created, ...assignments]);
      }
      setIsOpen(false);
    } catch (err) {
      const e = err as AxiosError<Record<string, string[] | string>>;
      const data = e.response?.data ?? {};
      const msg = Array.isArray(data.non_field_errors)
        ? data.non_field_errors[0]
        : Object.values(data).flat().join(' ');
      setError(String(msg) || 'Atama yapılamadı.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(a: Assignment) {
    if (!confirm(`"${a.task.title}" — ${a.user.name} ataması silinsin mi?`)) return;
    await assignmentService.deleteAssignment(a.id);
    setAssignments(assignments.filter(x => x.id !== a.id));
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Atamalar</h1>
        <Button onClick={openCreate}>+ Yeni Atama</Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
        <select value={filterUser} onChange={e => setFilterUser(Number(e.target.value))} className="rounded-md border border-gray-300 px-3 py-2 text-sm">
          <option value={0}>Tüm personel</option>
          {employees.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <Button variant="secondary" size="sm" onClick={() => { setFilterDate(''); setFilterUser(0); }}>Temizle</Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>{['Personel', 'Görev', 'Bölge', 'Vardiya', 'Tarih', 'Durum', 'İşlemler'].map(h => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(a => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{a.user.name}</td>
                <td className="px-4 py-3">{a.task.title}</td>
                <td className="px-4 py-3 text-gray-600">{a.zone?.name ?? '-'}</td>
                <td className="px-4 py-3 text-gray-600">{a.shift?.name ?? '-'}</td>
                <td className="px-4 py-3">{a.date}</td>
                <td className="px-4 py-3"><Badge status={a.status} /></td>
                <td className="px-4 py-3 flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => openEdit(a)}>Düzenle</Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(a)}>Sil</Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-400 text-sm">Atama bulunamadı.</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editing ? 'Atamayı Düzenle' : 'Yeni Atama'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">{error}</div>}

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Personel</label>
            <select className="rounded-md border border-gray-300 px-3 py-2 text-sm" value={form.user_id} onChange={e => setForm({ ...form, user_id: Number(e.target.value) })} required>
              <option value={0} disabled>Seç...</option>
              {employees.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Görev</label>
            <select className="rounded-md border border-gray-300 px-3 py-2 text-sm" value={form.task_id} onChange={e => setForm({ ...form, task_id: Number(e.target.value) })} required>
              <option value={0} disabled>Seç...</option>
              {tasks.map(t => <option key={t.id} value={t.id}>{t.title} (k:{t.coefficient})</option>)}
            </select>
          </div>

          <Input label="Tarih" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Vardiya</label>
            <select className="rounded-md border border-gray-300 px-3 py-2 text-sm" value={form.shift_id} onChange={e => setForm({ ...form, shift_id: Number(e.target.value) })} required>
              <option value={0} disabled>Seç...</option>
              {shifts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Bölge</label>
            <select className="rounded-md border border-gray-300 px-3 py-2 text-sm" value={form.zone_id} onChange={e => setForm({ ...form, zone_id: Number(e.target.value) })} required>
              <option value={0} disabled>Seç...</option>
              {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <Button variant="secondary" type="button" onClick={() => setIsOpen(false)}>İptal</Button>
            <Button type="submit" isLoading={saving}>{editing ? 'Kaydet' : 'Ata'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
