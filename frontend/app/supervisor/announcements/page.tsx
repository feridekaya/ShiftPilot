'use client';

import { useEffect, useState } from 'react';
import { Announcement, AnnouncementPriority } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import * as svc from '@/services/announcementsService';

const PRIORITY = {
  normal:   { label: 'Normal',  border: 'border-l-gray-300',  badge: 'bg-gray-100 dark:bg-gray-700/40 text-gray-600 dark:text-gray-300',   dot: 'bg-gray-400' },
  medium:   { label: 'Orta',    border: 'border-l-amber-400', badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300', dot: 'bg-amber-400' },
  critical: { label: 'Kritik',  border: 'border-l-red-500',   badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',     dot: 'bg-red-500' },
};

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form, setForm] = useState({
    title: '', content: '', priority: 'normal' as AnnouncementPriority, target_roles: [] as string[],
  });

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const data = await svc.getAnnouncements();
      setAnnouncements(data);
      data.filter(a => !a.is_read_by_me).forEach(a => svc.markAsRead(a.id).catch(() => null));
    } finally { setLoading(false); }
  }

  function canManage(a: Announcement) {
    return !!user?.unit && a.unit?.id === user.unit.id;
  }

  function openCreate() {
    setEditing(null);
    setForm({ title: '', content: '', priority: 'normal', target_roles: [] });
    setShowForm(true);
  }

  function openEdit(a: Announcement) {
    setEditing(a);
    setForm({ title: a.title, content: a.content, priority: a.priority, target_roles: a.target_roles ?? [] });
    setShowForm(true);
  }

  function toggleTargetRole(role: string) {
    setForm(f => ({
      ...f,
      target_roles: f.target_roles.includes(role) ? f.target_roles.filter(r => r !== role) : [...f.target_roles, role],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const updated = await svc.updateAnnouncement(editing.id, {
          title: form.title, content: form.content, priority: form.priority, target_roles: form.target_roles,
        });
        setAnnouncements(prev => prev.map(a => a.id === updated.id ? updated : a));
      } else {
        const created = await svc.createAnnouncement({
          title: form.title, content: form.content, priority: form.priority, target_roles: form.target_roles,
        });
        setAnnouncements(prev => [created, ...prev]);
      }
      setShowForm(false);
    } finally { setSaving(false); }
  }

  async function handleDelete(a: Announcement) {
    if (!confirm(`"${a.title}" silinsin mi?`)) return;
    await svc.deleteAnnouncement(a.id);
    setAnnouncements(prev => prev.filter(x => x.id !== a.id));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#0A1128] px-4 py-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Duyurular</h1>
          <p className="text-sm text-gray-400 dark:text-slate-500 mt-0.5">{announcements.length} yayında duyuru</p>
        </div>
        {user?.unit ? (
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
            Birimime Duyuru Ekle
          </button>
        ) : (
          <p className="text-xs text-amber-600 dark:text-amber-400 max-w-xs">Bir birime atanmadığınız için duyuru oluşturamazsınız.</p>
        )}
      </div>

      {announcements.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <svg className="w-24 h-24 text-gray-200 dark:text-slate-700 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/>
          </svg>
          <p className="text-lg font-semibold text-gray-400 dark:text-slate-500 mb-1">Henüz bir duyuru yayınlanmadı.</p>
          <p className="text-sm text-gray-400 dark:text-slate-500">Yöneticiniz veya biriminiz duyuru yayınladığında burada görünecek.</p>
        </div>
      )}

      <div className="flex flex-col gap-6">
        {announcements.map(a => {
          const p = PRIORITY[a.priority] ?? PRIORITY.normal;
          const isCritical = a.priority === 'critical';
          return (
            <div key={a.id} className={`bg-white dark:bg-[#111E38] rounded-xl shadow-sm border border-gray-100 dark:border-[#1E293B] border-l-4 ${p.border} ${!a.is_read_by_me ? 'ring-2 ring-indigo-100 dark:ring-indigo-900/50' : ''}`}>
              <div className="p-6">
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full ${p.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${p.dot}`} />
                        {p.label}
                      </span>
                      {a.unit && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300">
                          {a.unit.name}
                        </span>
                      )}
                      {!a.is_read_by_me && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300">Yeni</span>
                      )}
                    </div>
                    <h2 className="text-[17px] font-semibold text-[#111827] dark:text-slate-100 leading-snug">
                      {a.title}
                      {isCritical && (
                        <svg className="w-4 h-4 inline ml-1 -mt-0.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                        </svg>
                      )}
                    </h2>
                    <p className="text-xs text-[#6B7280] dark:text-slate-400 mt-1">
                      <svg className="w-3.5 h-3.5 inline mr-1 -mt-0.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2"/>
                      </svg>
                      {new Date(a.created_at).toLocaleDateString('tr-TR', {
                        year: 'numeric', month: 'long', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                      {a.created_by_name && <span className="ml-2 font-medium text-gray-500 dark:text-slate-400">· {a.created_by_name}</span>}
                    </p>
                  </div>
                  {canManage(a) && (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => openEdit(a)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-[#162543] text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-[#192d4a] font-medium transition-colors"
                      >
                        Düzenle
                      </button>
                      <button
                        onClick={() => handleDelete(a)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 font-medium transition-colors"
                      >
                        Sil
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-[#374151] dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{a.content}</p>
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="bg-white dark:bg-[#111E38] rounded-2xl shadow-2xl w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-[#1E293B]">
              <h2 className="font-bold text-gray-900 dark:text-slate-100">
                {editing ? 'Duyuruyu Düzenle' : `${user?.unit?.name ?? ''} Birimine Yeni Duyuru`}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Önem Derecesi</label>
                <div className="flex gap-2">
                  {(['normal', 'medium', 'critical'] as AnnouncementPriority[]).map(pv => (
                    <button
                      key={pv}
                      type="button"
                      onClick={() => setForm({ ...form, priority: pv })}
                      className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                        form.priority === pv
                          ? pv === 'critical' ? 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                            : pv === 'medium' ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                            : 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                          : 'border-gray-200 dark:border-[#1E293B] bg-white dark:bg-[#162543] text-gray-500 dark:text-slate-400 hover:border-gray-300 dark:hover:border-slate-500'
                      }`}
                    >
                      {PRIORITY[pv].label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Kime Gönderilsin?</label>
                <div className="flex gap-2">
                  {(['employee', 'supervisor'] as const).map(role => {
                    const labels = { employee: 'Personeller', supervisor: 'Şefler' };
                    const active = form.target_roles.includes(role);
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => toggleTargetRole(role)}
                        className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                          active
                            ? role === 'supervisor'
                              ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                              : 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'border-gray-200 dark:border-[#1E293B] bg-white dark:bg-[#162543] text-gray-500 dark:text-slate-400 hover:border-gray-300 dark:hover:border-slate-500'
                        }`}
                      >
                        {labels[role]}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1.5">
                  {form.target_roles.length === 0 ? 'Seçilmezse biriminizdeki herkese gönderilir.' : 'Yalnızca seçili gruplara gönderilir.'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Başlık</label>
                <input
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-[#1E293B] bg-white dark:bg-[#162543] text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="Duyuru başlığı..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">İçerik</label>
                <textarea
                  value={form.content}
                  onChange={e => setForm({ ...form, content: e.target.value })}
                  required
                  rows={5}
                  className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-[#1E293B] bg-white dark:bg-[#162543] text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                  placeholder="Duyuru içeriği..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-[#162543] rounded-xl hover:bg-gray-200 dark:hover:bg-[#192d4a] transition-colors">
                  İptal
                </button>
                <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60">
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
