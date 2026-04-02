'use client';

import { useEffect, useState } from 'react';
import { User, StaffTeam } from '@/types';
import * as userService from '@/services/users';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { AxiosError } from 'axios';

export default function StaffPage() {
  const [employees, setEmployees] = useState<User[]>([]);
  const [teams, setTeams] = useState<StaffTeam[]>([]);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [teamError, setTeamError] = useState('');
  const [savingTeam, setSavingTeam] = useState(false);
  const [assigningId, setAssigningId] = useState<number | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const [users, teamList] = await Promise.all([
      userService.getUsers(),
      userService.getTeams(),
    ]);
    setEmployees(users.filter(u => u.role === 'employee'));
    setTeams(teamList);
  }

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    setTeamError('');
    setSavingTeam(true);
    try {
      const created = await userService.createTeam(newTeamName.trim());
      setTeams([...teams, created]);
      setNewTeamName('');
      setIsTeamModalOpen(false);
    } catch (err) {
      const e = err as AxiosError<Record<string, string[]>>;
      setTeamError(Object.values(e.response?.data ?? {}).flat().join(' ') || 'Hata oluştu.');
    } finally {
      setSavingTeam(false);
    }
  }

  async function handleAssign(userId: number, teamId: number | null) {
    setAssigningId(userId);
    try {
      const updated = await userService.assignTeam(userId, teamId);
      setEmployees(employees.map(u => u.id === updated.id ? updated : u));
    } finally {
      setAssigningId(null);
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">Personel</h1>
        <Button onClick={() => { setNewTeamName(''); setTeamError(''); setIsTeamModalOpen(true); }}>
          + Ekip Ekle
        </Button>
      </div>

      {teams.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {teams.map(t => (
            <span key={t.id} className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">
              {t.name}
            </span>
          ))}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              {['Ad Soyad', 'E-posta', 'Cinsiyet', 'Ekip'].map(h => (
                <th key={h} className="px-4 py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {employees.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3 text-gray-600">
                  {u.gender === 'male' ? 'Erkek' : u.gender === 'female' ? 'Kadın' : '-'}
                </td>
                <td className="px-4 py-3">
                  <select
                    className="rounded-md border border-gray-300 px-2 py-1 text-sm disabled:opacity-50"
                    value={u.team?.id ?? ''}
                    disabled={assigningId === u.id}
                    onChange={e => handleAssign(u.id, e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">— Ekip yok —</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                  Henüz personel yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isTeamModalOpen} onClose={() => setIsTeamModalOpen(false)} title="Yeni Ekip">
        <form onSubmit={handleCreateTeam} className="flex flex-col gap-4">
          {teamError && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{teamError}</p>}
          <Input
            label="Ekip adı"
            value={newTeamName}
            onChange={e => setNewTeamName(e.target.value)}
            required
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="secondary" type="button" onClick={() => setIsTeamModalOpen(false)}>İptal</Button>
            <Button type="submit" isLoading={savingTeam}>Ekle</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
