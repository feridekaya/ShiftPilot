'use client';

import { useEffect, useState } from 'react';
import { Task, Zone, Role } from '@/types';
import * as taskService from '@/services/tasks';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { AxiosError } from 'axios';

const ALL_ROLES: Role[] = ['manager', 'supervisor', 'employee'];
const roleLabel: Record<Role, string> = { manager: 'Yönetici', supervisor: 'Süpervizör', employee: 'Çalışan' };
const emptyForm = { title: '', description: '', zone_id: 0, requires_photo: true, coefficient: 1, allowed_roles: ['employee'] as Role[], allowed_genders: '' };

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    taskService.getTasks().then(setTasks);
    taskService.getZones().then(setZones);
  }, []);

  function openCreate() { setEditing(null); setForm(emptyForm); setError(''); setIsOpen(true); }
  function openEdit(t: Task) {
    setEditing(t);
    setForm({ title: t.title, description: t.description, zone_id: t.zone?.id ?? 0, requires_photo: t.requires_photo, coefficient: t.coefficient, allowed_roles: t.allowed_roles, allowed_genders: t.allowed_genders ?? '' });
    setError(''); setIsOpen(true);
  }

  function toggleRole(role: Role) {
    setForm(f => ({ ...f, allowed_roles: f.allowed_roles.includes(role) ? f.allowed_roles.filter(r => r !== role) : [...f.allowed_roles, role] }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      const payload = { ...form, allowed_genders: form.allowed_genders || undefined };
      if (editing) {
        const updated = await taskService.updateTask(editing.id, payload);
        setTasks(tasks.map(t => t.id === updated.id ? updated : t));
      } else {
        const created = await taskService.createTask(payload);
        setTasks([...tasks, created]);
      }
      setIsOpen(false);
    } catch (err) {
      const e = err as AxiosError<Record<string, string[]>>;
      setError(Object.values(e.response?.data ?? {}).flat().join(' ') || 'Hata oluştu.');
    } finally { setSaving(false); }
  }

  async function handleDelete(t: Task) {
    if (!confirm(`"${t.title}" silinsin mi?`)) return;
    await taskService.deleteTask(t.id);
    setTasks(tasks.filter(x => x.id !== t.id));
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">Görevler</h1>
        <Button onClick={openCreate}>+ Yeni Görev</Button>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>{['Başlık', 'Bölge', 'Katsayı', 'Fotoğraf', 'Roller', 'İşlemler'].map(h => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tasks.map(t => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{t.title}</td>
                <td className="px-4 py-3 text-gray-600">{t.zone?.name ?? '-'}</td>
                <td className="px-4 py-3">{t.coefficient}</td>
                <td className="px-4 py-3">{t.requires_photo ? 'Evet' : 'Hayır'}</td>
                <td className="px-4 py-3 text-gray-600">{t.allowed_roles.map(r => roleLabel[r]).join(', ')}</td>
                <td className="px-4 py-3 flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => openEdit(t)}>Düzenle</Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(t)}>Sil</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editing ? 'Görevi Düzenle' : 'Yeni Görev'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
          <Input label="Başlık" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
          <Input label="Açıklama" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Bölge</label>
            <select className="rounded-md border border-gray-300 px-3 py-2 text-sm" value={form.zone_id} onChange={e => setForm({ ...form, zone_id: Number(e.target.value) })} required>
              <option value={0} disabled>Bölge seç...</option>
              {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
          </div>
          <Input label="Katsayı (min 1)" type="number" min={1} value={form.coefficient} onChange={e => setForm({ ...form, coefficient: Number(e.target.value) })} required />
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">İzin Verilen Roller</label>
            {ALL_ROLES.map(r => (
              <label key={r} className="flex items-center gap-2 text-sm mb-1">
                <input type="checkbox" checked={form.allowed_roles.includes(r)} onChange={() => toggleRole(r)} />
                {roleLabel[r]}
              </label>
            ))}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Cinsiyet Kısıtı</label>
            <select className="rounded-md border border-gray-300 px-3 py-2 text-sm" value={form.allowed_genders} onChange={e => setForm({ ...form, allowed_genders: e.target.value })}>
              <option value="">Hepsi</option>
              <option value="male">Erkek</option>
              <option value="female">Kadın</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.requires_photo} onChange={e => setForm({ ...form, requires_photo: e.target.checked })} />
            Fotoğraf zorunlu
          </label>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="secondary" type="button" onClick={() => setIsOpen(false)}>İptal</Button>
            <Button type="submit" isLoading={saving}>Kaydet</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
