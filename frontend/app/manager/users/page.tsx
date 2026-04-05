'use client';

import { useEffect, useState } from 'react';
import { User, Role, Gender, Assignment, ApprovalStatus } from '@/types';
import * as userService from '@/services/users';
import * as assignmentService from '@/services/assignments';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { AxiosError } from 'axios';

const emptyForm = { name: '', email: '', password: '', role: 'employee' as Role, gender: '' as Gender | '', is_active: true };

type SortField = 'name' | 'role' | 'email';
type SortDir = 'asc' | 'desc';

const roleOrder: Record<Role, number> = { manager: 0, supervisor: 1, employee: 2 };

const approvalLabel: Record<ApprovalStatus, string> = {
  pending: 'Bekliyor',
  approved: 'Onaylandı',
  rejected: 'Reddedildi',
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState('');
  const [hideInactive, setHideInactive] = useState(true);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // History modal
  const [historyUser, setHistoryUser] = useState<User | null>(null);
  const [history, setHistory] = useState<Assignment[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => { userService.getUsers().then(setUsers); }, []);

  function openCreate() {
    setEditing(null); setForm(emptyForm); setError(''); setIsOpen(true);
  }

  function openEdit(u: User) {
    setEditing(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role, gender: u.gender ?? '', is_active: u.is_active });
    setError(''); setIsOpen(true);
  }

  async function openHistory(u: User) {
    setHistoryUser(u);
    setHistory([]);
    setHistoryLoading(true);
    try {
      const all = await assignmentService.getAssignments({ user_id: u.id });
      setHistory(all);
    } finally {
      setHistoryLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setSaving(true);
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
      setError(Object.values(e.response?.data ?? {}).flat().join(' ') || 'Bir hata oluştu.');
    } finally { setSaving(false); }
  }

  async function handleDelete(u: User) {
    if (!confirm(`${u.name} silinsin mi?`)) return;
    await userService.deleteUser(u.id);
    setUsers(users.filter(x => x.id !== u.id));
  }

  function handleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  }

  const filtered = users
    .filter(u => hideInactive ? u.is_active : true)
    .filter(u => {
      const q = search.toLowerCase();
      return !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name')  cmp = a.name.localeCompare(b.name, 'tr');
      if (sortField === 'email') cmp = a.email.localeCompare(b.email, 'tr');
      if (sortField === 'role')  cmp = roleOrder[a.role] - roleOrder[b.role];
      return sortDir === 'asc' ? cmp : -cmp;
    });

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <span className="text-gray-300 ml-1">↕</span>;
    return <span className="text-indigo-500 ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">Kullanıcılar</h1>
        <Button onClick={openCreate}>+ Yeni Kullanıcı</Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <input
          type="text"
          placeholder="İsim veya e-posta ara..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <button
          onClick={() => setHideInactive(h => !h)}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
            hideInactive
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${hideInactive ? 'bg-white' : 'bg-gray-400'}`} />
          {hideInactive ? 'Aktif olanlar' : 'Tümü'}
        </button>
        {search && (
          <button onClick={() => setSearch('')} className="text-xs text-gray-400 hover:text-gray-600">
            Temizle ✕
          </button>
        )}
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} kullanıcı</span>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left cursor-pointer select-none hover:text-gray-900" onClick={() => handleSort('name')}>
                Ad <SortIcon field="name" />
              </th>
              <th className="px-4 py-3 text-left cursor-pointer select-none hover:text-gray-900" onClick={() => handleSort('email')}>
                E-posta <SortIcon field="email" />
              </th>
              <th className="px-4 py-3 text-left cursor-pointer select-none hover:text-gray-900" onClick={() => handleSort('role')}>
                Rol <SortIcon field="role" />
              </th>
              <th className="px-4 py-3 text-left">Cinsiyet</th>
              <th className="px-4 py-3 text-left">Aktif</th>
              <th className="px-4 py-3 text-left">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(u => (
              <tr key={u.id} className={`hover:bg-gray-50 ${!u.is_active ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3"><Badge status={u.role} /></td>
                <td className="px-4 py-3 text-gray-600">
                  {u.gender === 'male' ? 'Erkek' : u.gender === 'female' ? 'Kadın' : '-'}
                </td>
                <td className="px-4 py-3">{u.is_active ? '✓' : '✗'}</td>
                <td className="px-4 py-3 flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => openHistory(u)}>Geçmiş</Button>
                  <Button size="sm" variant="secondary" onClick={() => openEdit(u)}>Düzenle</Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(u)}>Sil</Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">Kullanıcı bulunamadı.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Create / Edit Modal ── */}
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

      {/* ── Geçmiş Modal ── */}
      <Modal
        isOpen={!!historyUser}
        onClose={() => setHistoryUser(null)}
        title={historyUser ? `${historyUser.name} — Görev Geçmişi` : ''}
      >
        {historyLoading ? (
          <div className="flex justify-center py-8"><Spinner size="lg" /></div>
        ) : history.length === 0 ? (
          <p className="text-center text-gray-400 py-6">Henüz görev yok.</p>
        ) : (
          <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
            {history.map(a => (
              <div key={a.id} className="border rounded-lg p-3 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">{a.task.title}</p>
                    <p className="text-xs text-gray-500">
                      {a.date}
                      {a.zone && ` · ${a.zone.name}`}
                      {a.shift && ` · ${a.shift.name}`}
                    </p>
                  </div>
                  <Badge status={a.status} />
                </div>
                {a.submissions && a.submissions.length > 0 && (
                  <div className="pl-2 border-l-2 border-gray-100 flex flex-col gap-2 mt-1">
                    {a.submissions.map((s, idx) => (
                      <div key={s.id} className="text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">#{idx + 1}</span>
                          <span className={
                            s.approval_status === 'approved' ? 'text-green-600 font-medium' :
                            s.approval_status === 'rejected' ? 'text-red-600 font-medium' :
                            'text-yellow-600 font-medium'
                          }>
                            {approvalLabel[s.approval_status]}
                          </span>
                          <span className="text-gray-400">
                            {new Date(s.submitted_at).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {s.approved_by && (
                            <span className="text-gray-400">· {s.approved_by}</span>
                          )}
                        </div>
                        {s.note && (
                          <p className="mt-0.5 text-gray-500 italic pl-4">"{s.note}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
