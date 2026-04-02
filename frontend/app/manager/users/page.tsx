'use client';

import { useEffect, useState } from 'react';
import { User, Role, Gender } from '@/types';
import * as userService from '@/services/users';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { AxiosError } from 'axios';

const emptyForm = { name: '', email: '', password: '', role: 'employee' as Role, gender: '' as Gender | '', is_active: true };

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setUsers(await userService.getUsers());
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setIsOpen(true);
  }

  function openEdit(u: User) {
    setEditing(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role, gender: u.gender ?? '', is_active: u.is_active });
    setError('');
    setIsOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = { ...form, gender: form.gender || undefined };
      if (editing) {
        const updated = await userService.updateUser(editing.id, payload);
        setUsers(users.map(u => u.id === updated.id ? updated : u));
      } else {
        const created = await userService.createUser({ ...payload, password: form.password });
        setUsers([...users, created]);
      }
      setIsOpen(false);
    } catch (err) {
      const e = err as AxiosError<Record<string, string[]>>;
      const msg = Object.values(e.response?.data ?? {}).flat().join(' ');
      setError(msg || 'Bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(u: User) {
    if (!confirm(`${u.name} silinsin mi?`)) return;
    await userService.deleteUser(u.id);
    setUsers(users.filter(x => x.id !== u.id));
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">Kullanıcılar</h1>
        <Button onClick={openCreate}>+ Yeni Kullanıcı</Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              {['Ad', 'E-posta', 'Rol', 'Cinsiyet', 'Aktif', 'İşlemler'].map(h => (
                <th key={h} className="px-4 py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3"><Badge status={u.role} /></td>
                <td className="px-4 py-3 text-gray-600">{u.gender ?? '-'}</td>
                <td className="px-4 py-3">{u.is_active ? '✓' : '✗'}</td>
                <td className="px-4 py-3 flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => openEdit(u)}>Düzenle</Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(u)}>Sil</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editing ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
          <Input label="Ad Soyad" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          <Input label="E-posta" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          <Input label={editing ? 'Şifre (değiştirmek için)' : 'Şifre'} type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required={!editing} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Rol</label>
            <select className="rounded-md border border-gray-300 px-3 py-2 text-sm" value={form.role} onChange={e => setForm({ ...form, role: e.target.value as Role })}>
              <option value="employee">Personel</option>
              <option value="supervisor">Şef</option>
              <option value="manager">Yönetici</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Cinsiyet</label>
            <select className="rounded-md border border-gray-300 px-3 py-2 text-sm" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value as Gender | '' })}>
              <option value="">Belirtilmemiş</option>
              <option value="male">Erkek</option>
              <option value="female">Kadın</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
            Aktif
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
