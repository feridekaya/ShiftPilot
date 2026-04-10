'use client';

import { useEffect, useState } from 'react';
import { Zone } from '@/types';
import * as taskService from '@/services/tasks';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';

export default function ZonesPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Zone | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => { taskService.getZones().then(setZones); }, []);

  function openCreate() {
    setEditing(null);
    setForm({ name: '', description: '' });
    setIsOpen(true);
  }

  function openEdit(z: Zone) {
    setEditing(z);
    setForm({ name: z.name, description: z.description });
    setIsOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const updated = await taskService.updateZone(editing.id, form);
        setZones(zones.map(z => z.id === updated.id ? updated : z));
      } else {
        const created = await taskService.createZone(form);
        setZones([...zones, created]);
      }
      setIsOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(z: Zone) {
    if (!confirm(`"${z.name}" silinsin mi?`)) return;
    await taskService.deleteZone(z.id);
    setZones(zones.filter(x => x.id !== z.id));
  }

  return (
    <div className="max-w-2xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">Bölgeler</h1>
        <Button onClick={openCreate}>+ Yeni Bölge</Button>
      </div>

      <div className="bg-white rounded-lg shadow divide-y">
        {zones.map(z => (
          <div key={z.id} className="px-4 py-3 flex justify-between items-center">
            <div>
              <p className="font-medium">{z.name}</p>
              {z.description && <p className="text-sm text-gray-500">{z.description}</p>}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => openEdit(z)}>Düzenle</Button>
              <Button size="sm" variant="danger" onClick={() => handleDelete(z)}>Sil</Button>
            </div>
          </div>
        ))}
        {zones.length === 0 && <p className="px-4 py-6 text-sm text-gray-400 text-center">Henüz bölge yok.</p>}
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editing ? 'Bölgeyi Düzenle' : 'Yeni Bölge'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Bölge Adı" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          <Input label="Açıklama" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="secondary" type="button" onClick={() => setIsOpen(false)}>İptal</Button>
            <Button type="submit" isLoading={saving}>Kaydet</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
