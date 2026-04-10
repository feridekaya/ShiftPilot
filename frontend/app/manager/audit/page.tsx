'use client';

import { useEffect, useRef, useState } from 'react';
import * as assignmentService from '@/services/assignments';
import { AuditEntry } from '@/services/assignments';
import * as taskService from '@/services/tasks';
import * as userService from '@/services/users';
import { Task, User } from '@/types';
import { downloadExcel } from '@/lib/excel';

function toISO(d: Date) { return d.toLocaleDateString('en-CA'); }

function StarDisplay({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-gray-300 text-xs">—</span>;
  return (
    <span className="text-amber-400 text-sm tracking-tighter">
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
      <span className="text-xs text-gray-400 ml-1">{rating}/5</span>
    </span>
  );
}

function StatusBadge({ status }: { status: 'approved' | 'rejected' }) {
  return status === 'approved'
    ? <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">✓ Onaylandı</span>
    : <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">✕ Reddedildi</span>;
}

export default function AuditPage() {
  const today = toISO(new Date());
  const sevenDaysAgo = toISO(new Date(Date.now() - 7 * 86400_000));

  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [supervisors, setSupervisors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Filters
  const [supervisorId, setSupervisorId] = useState('');
  const [taskId, setTaskId] = useState('');
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState(sevenDaysAgo);
  const [dateTo, setDateTo] = useState(today);

  async function load() {
    const data = await assignmentService.getAuditLog({
      supervisor_id: supervisorId ? Number(supervisorId) : undefined,
      task_id: taskId ? Number(taskId) : undefined,
      status: status || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    });
    setEntries(data);
    setLoading(false);
  }

  // Initial load + static data
  useEffect(() => {
    Promise.all([
      taskService.getTasks(),
      userService.getUsers(),
    ]).then(([allTasks, allUsers]) => {
      setTasks(allTasks);
      setSupervisors(allUsers.filter(u => u.role === 'supervisor' || u.role === 'manager'));
    });
    load();
  }, []);

  // Auto-refresh every 10s
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (autoRefresh) {
      pollRef.current = setInterval(load, 10_000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [autoRefresh, supervisorId, taskId, status, dateFrom, dateTo]);

  // Stats
  const approvedEntries = entries.filter(e => e.approval_status === 'approved');
  const rejectedEntries = entries.filter(e => e.approval_status === 'rejected');
  const ratedEntries = approvedEntries.filter(e => e.rating);
  const avgRating = ratedEntries.length
    ? (ratedEntries.reduce((s, e) => s + (e.rating ?? 0), 0) / ratedEntries.length).toFixed(1)
    : null;

  // Most rejected tasks
  const taskRejections: Record<string, number> = {};
  for (const e of rejectedEntries) {
    taskRejections[e.task_title] = (taskRejections[e.task_title] ?? 0) + 1;
  }
  const topRejected = Object.entries(taskRejections).sort((a, b) => b[1] - a[1]).slice(0, 3);

  // Supervisor stats
  const supStats: Record<string, { name: string; approved: number; rejected: number; totalRating: number; ratingCount: number }> = {};
  for (const e of entries) {
    if (!e.supervisor_name) continue;
    const key = String(e.supervisor_id);
    if (!supStats[key]) supStats[key] = { name: e.supervisor_name, approved: 0, rejected: 0, totalRating: 0, ratingCount: 0 };
    if (e.approval_status === 'approved') {
      supStats[key].approved++;
      if (e.rating) { supStats[key].totalRating += e.rating; supStats[key].ratingCount++; }
    } else {
      supStats[key].rejected++;
    }
  }

  function handleExport() {
    const rows = entries.map(e => ({
      'Tarih': e.assignment_date,
      'Personel': e.employee_name,
      'Görev': e.task_title,
      'Bölge': e.zone_name ?? '',
      'Durum': e.approval_status === 'approved' ? 'Onaylandı' : 'Reddedildi',
      'Şef': e.supervisor_name ?? '',
      'Puan': e.rating ?? '',
      'Not': e.note,
      'Gönderim Zamanı': new Date(e.submitted_at).toLocaleString('tr-TR'),
    }));
    downloadExcel([{ name: 'Denetim', rows }], `denetim_${today}`);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Denetim Masası</h1>
          <p className="text-sm text-gray-500 mt-0.5">Tüm onay ve red işlemlerinin kaydı</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
            <div
              onClick={() => setAutoRefresh(r => !r)}
              className={`relative w-8 h-4 rounded-full transition-colors ${autoRefresh ? 'bg-green-500' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${autoRefresh ? 'left-4' : 'left-0.5'}`} />
            </div>
            Canlı
          </label>
          <button onClick={handleExport} disabled={entries.length === 0}
            className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 disabled:opacity-40">
            ⬇ Excel
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Toplam İşlem', value: entries.length, color: 'text-gray-800' },
          { label: 'Onaylanan', value: approvedEntries.length, color: 'text-green-600' },
          { label: 'Reddedilen', value: rejectedEntries.length, color: 'text-red-600' },
          { label: 'Ort. Puan', value: avgRating ? `${avgRating} ★` : '—', color: 'text-amber-500' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Supervisor + top rejected side cards */}
      {(Object.keys(supStats).length > 0 || topRejected.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Supervisor stats */}
          {Object.keys(supStats).length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Şef İstatistikleri</p>
              </div>
              <div className="divide-y divide-gray-50">
                {Object.values(supStats).sort((a, b) => (b.approved + b.rejected) - (a.approved + a.rejected)).map(s => (
                  <div key={s.name} className="px-4 py-2.5 flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-gray-800">{s.name}</span>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-green-600 font-semibold">{s.approved} ✓</span>
                      <span className="text-red-500 font-semibold">{s.rejected} ✕</span>
                      {s.ratingCount > 0 && (
                        <span className="text-amber-500 font-semibold">
                          {(s.totalRating / s.ratingCount).toFixed(1)} ★
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Most rejected tasks */}
          {topRejected.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">En Çok Reddedilen Görevler</p>
              </div>
              <div className="divide-y divide-gray-50">
                {topRejected.map(([title, count], i) => (
                  <div key={title} className="px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-black w-5 ${i === 0 ? 'text-red-500' : 'text-gray-300'}`}>#{i + 1}</span>
                      <span className="text-sm text-gray-800">{title}</span>
                    </div>
                    <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">{count} red</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 bg-white rounded-xl border border-gray-100 shadow-sm p-3">
        <select value={supervisorId} onChange={e => setSupervisorId(e.target.value)}
          className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
          <option value="">Tüm şefler</option>
          {supervisors.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <select value={taskId} onChange={e => setTaskId(e.target.value)}
          className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 max-w-[200px]">
          <option value="">Tüm görevler</option>
          {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
          <option value="">Tüm durumlar</option>
          <option value="approved">Onaylanan</option>
          <option value="rejected">Reddedilen</option>
        </select>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        <span className="self-center text-gray-400 text-sm">→</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        <button onClick={load}
          className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors">
          Uygula
        </button>
      </div>

      {/* Live feed table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-20 text-gray-400">Bu filtreye ait kayıt bulunamadı.</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-800 text-white text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">Zaman</th>
                <th className="px-4 py-3 text-left">Personel</th>
                <th className="px-4 py-3 text-left">Görev</th>
                <th className="px-4 py-3 text-left">Şef</th>
                <th className="px-4 py-3 text-center">Durum</th>
                <th className="px-4 py-3 text-center">Puan</th>
                <th className="px-4 py-3 text-left">Not</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => {
                const rowBg = (['bg-white', 'bg-[#f8f9fa]', 'bg-[#f0f2f5]'] as const)[i % 3];
                return (
                  <tr key={e.id} className={`${rowBg} transition-colors hover:bg-[#e9ecef]`}>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <p className="text-xs text-gray-500">{e.assignment_date}</p>
                      <p className="text-[10px] text-gray-300">{new Date(e.submitted_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="px-4 py-2.5 font-medium text-gray-800">{e.employee_name}</td>
                    <td className="px-4 py-2.5">
                      <p className="text-gray-800">{e.task_title}</p>
                      {e.zone_name && <p className="text-[10px] text-gray-400">📍 {e.zone_name}</p>}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">{e.supervisor_name ?? '—'}</td>
                    <td className="px-4 py-2.5 text-center"><StatusBadge status={e.approval_status} /></td>
                    <td className="px-4 py-2.5 text-center"><StarDisplay rating={e.rating} /></td>
                    <td className="px-4 py-2.5 text-xs text-gray-500 max-w-[180px]">
                      {e.note || <span className="text-gray-200">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {autoRefresh && <p className="text-[10px] text-gray-300 text-center">Her 10 saniyede güncellenir</p>}
    </div>
  );
}
