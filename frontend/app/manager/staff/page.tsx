'use client';

import { useEffect, useState } from 'react';
import { User, StaffTeam, Assignment, ApprovalStatus } from '@/types';
import * as userService from '@/services/users';
import * as assignmentService from '@/services/assignments';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { AxiosError } from 'axios';

const statusLabel: Record<string, string> = {
  pending: 'Bekliyor',
  completed: 'Gönderildi',
  approved: 'Onaylandı',
  rejected: 'Reddedildi',
};

const approvalLabel: Record<ApprovalStatus, string> = {
  pending: 'Bekliyor',
  approved: 'Onaylandı',
  rejected: 'Reddedildi',
};

export default function StaffPage() {
  const [employees, setEmployees] = useState<User[]>([]);
  const [teams, setTeams] = useState<StaffTeam[]>([]);

  // Ekip ekleme modal
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [teamError, setTeamError] = useState('');
  const [savingTeam, setSavingTeam] = useState(false);

  // Atama kaydı
  const [assigningId, setAssigningId] = useState<number | null>(null);

  // Geçmiş modal
  const [historyUser, setHistoryUser] = useState<User | null>(null);
  const [history, setHistory] = useState<Assignment[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

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
              {['Ad Soyad', 'E-posta', 'Cinsiyet', 'Ekip', 'İşlemler'].map(h => (
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
                <td className="px-4 py-3">
                  <Button size="sm" variant="secondary" onClick={() => openHistory(u)}>
                    Geçmiş
                  </Button>
                </td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                  Henüz personel yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Ekip Ekle Modal ── */}
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
                {/* Görev başlığı + durum */}
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

                {/* Gönderim denemeleri */}
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
