'use client';

import { useEffect, useState } from 'react';
import { Shift } from '@/types';
import * as taskService from '@/services/tasks';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [form, setForm] = useState({ name: '', start_time: '', end_time: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { taskService.getShifts().then(setShifts); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const s = await taskService.createShift(form);
    setShifts([...shifts, s]);
    setForm({ name: '', start_time: '', end_time: '' });
    setSaving(false);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold mb-6">Vardiyalar</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-4 flex flex-col gap-3 mb-6">
        <Input label="Vardiya Adı" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Başlangıç" type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} required />
          <Input label="Bitiş" type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} required />
        </div>
        <Button type="submit" isLoading={saving} size="sm" className="self-end">Ekle</Button>
      </form>
      <div className="bg-white rounded-lg shadow divide-y">
        {shifts.map(s => (
          <div key={s.id} className="px-4 py-3 flex justify-between">
            <p className="font-medium">{s.name}</p>
            <p className="text-sm text-gray-500">{s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}</p>
          </div>
        ))}
        {shifts.length === 0 && <p className="px-4 py-6 text-sm text-gray-400 text-center">Henüz vardiya yok.</p>}
      </div>
    </div>
  );
}
