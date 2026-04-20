'use client';

import { useEffect, useState } from 'react';
import { Announcement, AnnouncementPriority } from '@/types';
import * as svc from '@/services/announcementsService';

const PRIORITY = {
  normal:   { label: 'Normal',  border: 'border-l-gray-300',   badge: 'bg-gray-100 text-gray-600',   dot: 'bg-gray-400' },
  medium:   { label: 'Orta',    border: 'border-l-amber-400',  badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' },
  critical: { label: 'Kritik',  border: 'border-l-red-500',    badge: 'bg-red-100 text-red-700',     dot: 'bg-red-500' },
};

function ClockIcon() {
  return (
    <svg className="w-3.5 h-3.5 inline mr-1 -mt-0.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2"/>
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg className="w-4 h-4 inline ml-1 -mt-0.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
    </svg>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="text-gray-200 mb-6">
        <svg className="w-24 h-24 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/>
        </svg>
      </div>
      <p className="text-lg font-semibold text-gray-400 mb-2">Henüz bir duyuru yayınlanmadı.</p>
      <p className="text-sm text-gray-400 mb-6">İlk duyuruyu oluşturmak için aşağıdaki butonu kullanın.</p>
      <button onClick={onNew} className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">
        + Yeni Duyuru Oluştur
      </button>
    </div>
  );
}

interface ReaderModalProps {
  announcement: Announcement;
  onClose: () => void;
}

function ReaderModal({ announcement, onClose }: ReaderModalProps) {
  const readers = announcement.readers ?? [];
  const allActive = announcement.total_users;
  const unread = allActive - readers.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">Görüntüleme Detayı</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="flex gap-3 mb-5">
          <div className="flex-1 bg-emerald-50 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-emerald-600">{readers.length}</div>
            <div className="text-xs text-gray-500 mt-0.5">Okudu</div>
          </div>
          <div className="flex-1 bg-red-50 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-red-500">{unread < 0 ? 0 : unread}</div>
            <div className="text-xs text-gray-500 mt-0.5">Okumadı</div>
          </div>
        </div>
        {readers.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Okuyanlar</p>
            {readers.map(r => (
              <div key={r.id} className="flex items-center gap-2.5 py-1.5">
                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
                  {r.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{r.name}</p>
                  <p className="text-xs text-gray-400 capitalize">{r.role}</p>
                </div>
                <svg className="w-4 h-4 text-emerald-500 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [readerAnn, setReaderAnn] = useState<Announcement | null>(null);
  const [form, setForm] = useState({ title: '', content: '', priority: 'normal' as AnnouncementPriority });

  useEffect(() => { load(); }, []);

  async function load() {
    try { setAnnouncements(await svc.getAnnouncements()); }
    finally { setLoading(false); }
  }

  function openCreate() {
    setEditing(null);
    setForm({ title: '', content: '', priority: 'normal' });
    setShowForm(true);
  }

  function openEdit(a: Announcement) {
    setEditing(a);
    setForm({ title: a.title, content: a.content, priority: a.priority });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const updated = await svc.updateAnnouncement(editing.id, form);
        setAnnouncements(prev => prev.map(a => a.id === updated.id ? updated : a));
      } else {
        const created = await svc.createAnnouncement(form);
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
    <div className="min-h-screen bg-[#F9FAFB] px-4 py-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Duyurular</h1>
          <p className="text-sm text-gray-400 mt-0.5">{announcements.length} yayında duyuru</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
          Yeni Duyuru
        </button>
      </div>

      {/* Empty state */}
      {announcements.length === 0 && <EmptyState onNew={openCreate} />}

      {/* Feed */}
      <div className="flex flex-col gap-6">
        {announcements.map(a => {
          const p = PRIORITY[a.priority] ?? PRIORITY.normal;
          const isCritical = a.priority === 'critical';
          return (
            <div key={a.id} className={`bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 ${p.border} overflow-hidden`}>
              <div className="p-6">
                {/* Top row */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full ${p.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${p.dot}`} />
                        {p.label}
                      </span>
                      <h2 className="text-[17px] font-semibold text-[#111827] leading-snug">
                        {a.title}
                        {isCritical && <AlertIcon />}
                      </h2>
                    </div>
                    <p className="text-xs text-[#6B7280] mt-1.5">
                      <ClockIcon />
                      {new Date(a.created_at).toLocaleDateString('tr-TR', {
                        year: 'numeric', month: 'long', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                      {a.created_by_name && <span className="ml-2 font-medium text-gray-500">· {a.created_by_name}</span>}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => openEdit(a)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 font-medium transition-colors"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => handleDelete(a)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-medium transition-colors"
                    >
                      Sil
                    </button>
                  </div>
                </div>

                {/* Content */}
                <p className="text-[#374151] text-sm leading-relaxed whitespace-pre-wrap">{a.content}</p>

                {/* Footer — read count */}
                <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-end">
                  <button
                    onClick={() => setReaderAnn(a)}
                    className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-600 transition-colors font-medium"
                  >
                    <EyeIcon />
                    Görüldü: {a.read_count}/{a.total_users}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reader modal */}
      {readerAnn && <ReaderModal announcement={readerAnn} onClose={() => setReaderAnn(null)} />}

      {/* Create / Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{editing ? 'Duyuruyu Düzenle' : 'Yeni Duyuru'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Önem Derecesi</label>
                <div className="flex gap-2">
                  {(['normal', 'medium', 'critical'] as AnnouncementPriority[]).map(pv => (
                    <button
                      key={pv}
                      type="button"
                      onClick={() => setForm({ ...form, priority: pv })}
                      className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                        form.priority === pv
                          ? pv === 'critical' ? 'border-red-500 bg-red-50 text-red-700'
                            : pv === 'medium' ? 'border-amber-400 bg-amber-50 text-amber-700'
                            : 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      {PRIORITY[pv].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Başlık</label>
                <input
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="Duyuru başlığı..."
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">İçerik</label>
                <textarea
                  value={form.content}
                  onChange={e => setForm({ ...form, content: e.target.value })}
                  required
                  rows={5}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                  placeholder="Duyuru içeriği..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
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
