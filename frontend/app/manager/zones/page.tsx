'use client';

import { useEffect, useState } from 'react';
import { Zone, Unit, JobRole, Role } from '@/types';
import * as taskService from '@/services/tasks';
import * as unitService from '@/services/units';
import * as roleService from '@/services/roles';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';

type Tab = 'zones' | 'units' | 'roles';

const TABS: { key: Tab; label: string }[] = [
  { key: 'zones', label: 'Bölgeler' },
  { key: 'units', label: 'Birimler' },
  { key: 'roles', label: 'Roller' },
];

const yetkiLabel: Record<Role, string> = {
  manager: 'Yönetici',
  supervisor: 'Şef',
  employee: 'Personel',
};

export default function DuzenPage() {
  const [tab, setTab] = useState<Tab>('zones');

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold mb-6">Düzen</h1>

      <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-[#1E293B]">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'zones' && <ZonesTab />}
      {tab === 'units' && <UnitsTab />}
      {tab === 'roles' && <RolesTab />}
    </div>
  );
}

function ZonesTab() {
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
    <div>
      <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
        Bölge: görevlerin yapıldığı fiziksel yer (örn. Ön Kasa, Mutfak).
      </p>
      <div className="flex justify-end mb-4">
        <Button onClick={openCreate}>+ Yeni Bölge</Button>
      </div>

      <div className="bg-white dark:bg-[#111E38] rounded-lg shadow divide-y dark:divide-[#1E293B]">
        {zones.map(z => (
          <div key={z.id} className="px-4 py-3 flex justify-between items-center dark:text-slate-100">
            <div>
              <p className="font-medium">{z.name}</p>
              {z.description && <p className="text-sm text-gray-500 dark:text-slate-400">{z.description}</p>}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => openEdit(z)}>Düzenle</Button>
              <Button size="sm" variant="danger" onClick={() => handleDelete(z)}>Sil</Button>
            </div>
          </div>
        ))}
        {zones.length === 0 && <p className="px-4 py-6 text-sm text-gray-400 dark:text-slate-500 text-center">Henüz bölge yok.</p>}
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

function UnitsTab() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Unit | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => { unitService.getUnits().then(setUnits); }, []);

  function openCreate() {
    setEditing(null);
    setForm({ name: '', description: '' });
    setIsOpen(true);
  }

  function openEdit(u: Unit) {
    setEditing(u);
    setForm({ name: u.name, description: u.description });
    setIsOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const updated = await unitService.updateUnit(editing.id, form);
        setUnits(units.map(u => u.id === updated.id ? updated : u));
      } else {
        const created = await unitService.createUnit(form);
        setUnits([...units, created]);
      }
      setIsOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(u: Unit) {
    if (!confirm(`"${u.name}" silinsin mi?`)) return;
    await unitService.deleteUnit(u.id);
    setUnits(units.filter(x => x.id !== u.id));
  }

  return (
    <div>
      <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
        Birim: personelin bağlı olduğu ekip (örn. Mutfak Ekibi, Bar Ekibi). Şefler ve personel kendi birimlerinin verisini görür.
      </p>
      <div className="flex justify-end mb-4">
        <Button onClick={openCreate}>+ Yeni Birim</Button>
      </div>

      <div className="bg-white dark:bg-[#111E38] rounded-lg shadow divide-y dark:divide-[#1E293B]">
        {units.map(u => (
          <div key={u.id} className="px-4 py-3 flex justify-between items-center dark:text-slate-100">
            <div>
              <p className="font-medium">{u.name}</p>
              {u.description && <p className="text-sm text-gray-500 dark:text-slate-400">{u.description}</p>}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => openEdit(u)}>Düzenle</Button>
              <Button size="sm" variant="danger" onClick={() => handleDelete(u)}>Sil</Button>
            </div>
          </div>
        ))}
        {units.length === 0 && <p className="px-4 py-6 text-sm text-gray-400 dark:text-slate-500 text-center">Henüz birim yok.</p>}
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editing ? 'Birimi Düzenle' : 'Yeni Birim'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Birim Adı" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
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

function RolesTab() {
  const [roles, setRoles] = useState<JobRole[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [form, setForm] = useState<{ name: string; base_role: Role; unit_id: number | null }>({ name: '', base_role: 'employee', unit_id: null });
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<JobRole | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => { roleService.getRoles().then(setRoles); }, []);
  useEffect(() => { unitService.getUnits().then(setUnits); }, []);

  function openCreate() {
    setEditing(null);
    setForm({ name: '', base_role: 'employee', unit_id: null });
    setIsOpen(true);
  }

  function openEdit(r: JobRole) {
    setEditing(r);
    setForm({ name: r.name, base_role: r.base_role, unit_id: r.unit?.id ?? null });
    setIsOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const updated = await roleService.updateRole(editing.id, form);
        setRoles(roles.map(r => r.id === updated.id ? updated : r));
      } else {
        const created = await roleService.createRole(form);
        setRoles([...roles, created]);
      }
      setIsOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(r: JobRole) {
    if (!confirm(`"${r.name}" silinsin mi?`)) return;
    await roleService.deleteRole(r.id);
    setRoles(roles.filter(x => x.id !== r.id));
  }

  return (
    <div>
      <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
        Rol: personele gösterilecek iş unvanı, bir Yetki seviyesine bağlanır (örn. Rol: &quot;Suşi Şefi&quot;, Yetki: Şef).
      </p>
      <div className="flex justify-end mb-4">
        <Button onClick={openCreate}>+ Yeni Rol</Button>
      </div>

      <div className="bg-white dark:bg-[#111E38] rounded-lg shadow divide-y dark:divide-[#1E293B]">
        {roles.map(r => (
          <div key={r.id} className="px-4 py-3 flex justify-between items-center dark:text-slate-100">
            <div>
              <p className="font-medium">{r.name}</p>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Yetki: {yetkiLabel[r.base_role]}{r.unit && ` · Birim: ${r.unit.name}`}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => openEdit(r)}>Düzenle</Button>
              <Button size="sm" variant="danger" onClick={() => handleDelete(r)}>Sil</Button>
            </div>
          </div>
        ))}
        {roles.length === 0 && <p className="px-4 py-6 text-sm text-gray-400 dark:text-slate-500 text-center">Henüz rol yok.</p>}
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editing ? 'Rolü Düzenle' : 'Yeni Rol'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Rol İsmi" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Örn. Suşi Şefi" />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Yetki</label>
            <select
              className="rounded-md border border-gray-300 dark:border-[#1E293B] bg-white dark:bg-[#111E38] dark:text-slate-100 px-3 py-2 text-sm"
              value={form.base_role}
              onChange={e => setForm({ ...form, base_role: e.target.value as Role })}
            >
              <option value="employee">Personel</option>
              <option value="supervisor">Şef</option>
              <option value="manager">Yönetici</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Birim (opsiyonel)</label>
            <select
              className="rounded-md border border-gray-300 dark:border-[#1E293B] bg-white dark:bg-[#111E38] dark:text-slate-100 px-3 py-2 text-sm"
              value={form.unit_id ?? ''}
              onChange={e => setForm({ ...form, unit_id: e.target.value ? Number(e.target.value) : null })}
            >
              <option value="">Yok</option>
              {units.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 dark:text-slate-500">
              Bir Birim seçilirse, bu Rol atanan kullanıcının Birimi otomatik olarak buna ayarlanır.
            </p>
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
