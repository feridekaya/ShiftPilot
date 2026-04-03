'use client';

import { useEffect, useState } from 'react';
import { Shift } from '@/types';
import * as taskService from '@/services/tasks';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';

const emptyForm = { name: '', start_time: '', end_time: '' };

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Shift | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => { taskService.getShifts().then(setShifts); }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setIsOpen(true);
  }

  function openEdit(s: Shift) {
    setEditing(s);
    setForm({ name: s.name, start_time: s.start_time, end_time: s.end_time });
    setIsOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const updated = await taskService.updateShift(editing.id, form);
        setShifts(shifts.map(s => s.id === updated.id ? updated : s));
      } else {
        const created = await taskService.createShift(form);
        setShifts([...shifts, created]);
      }
      setIsOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(s: Shift) {
    if (!confirm(`"${s.name}" silinsin mi?`)) return;
    await taskService.deleteShift(s.id);
    setShifts(shifts.filter(x => x.id !== s.id));
  }

  return (
    <div className="max-w-2xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">Vardiyalar</h1>
        <Button onClick={openCreate}>+ Yeni Vardiya</Button>
      </div>

      <div className="bg-white rounded-lg shadow divide-y">
        {shifts.map(s => (
          <div key={s.id} className="px-4 py-3 flex justify-between items-center">
            <div>
              <p className="font-medium">{s.name}</p>
              <p className="text-sm text-gray-500">{s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => openEdit(s)}>Düzenle</Button>
              <Button size="sm" variant="danger" onClick={() => handleDelete(s)}>Sil</Button>
            </div>
          </div>
        ))}
        {shifts.length === 0 && <p className="px-4 py-6 text-sm text-gray-400 text-center">Henüz vardiya yok.</p>}
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editing ? 'Vardiyayı Düzenle' : 'Yeni Vardiya'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Vardiya Adı" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Başlangıç" type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} required />
            <Input label="Bitiş" type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} required />
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
