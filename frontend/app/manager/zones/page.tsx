'use client';

import { useEffect, useState } from 'react';
import { Zone } from '@/types';
import * as taskService from '@/services/tasks';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function ZonesPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { taskService.getZones().then(setZones); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const z = await taskService.createZone({ name, description });
    setZones([...zones, z]);
    setName('');
    setDescription('');
    setSaving(false);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold mb-6">Bölgeler</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-4 flex flex-col gap-3 mb-6">
        <Input label="Bölge Adı" value={name} onChange={e => setName(e.target.value)} required />
        <Input label="Açıklama" value={description} onChange={e => setDescription(e.target.value)} />
        <Button type="submit" isLoading={saving} size="sm" className="self-end">Ekle</Button>
      </form>
      <div className="bg-white rounded-lg shadow divide-y">
        {zones.map(z => (
          <div key={z.id} className="px-4 py-3">
            <p className="font-medium">{z.name}</p>
            {z.description && <p className="text-sm text-gray-500">{z.description}</p>}
          </div>
        ))}
        {zones.length === 0 && <p className="px-4 py-6 text-sm text-gray-400 text-center">Henüz bölge yok.</p>}
      </div>
    </div>
  );
}
