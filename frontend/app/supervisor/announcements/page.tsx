'use client';

import { useEffect, useState } from 'react';
import { Announcement } from '@/types';
import * as svc from '@/services/announcementsService';

const PRIORITY = {
  normal:   { label: 'Normal',  border: 'border-l-gray-300',  badge: 'bg-gray-100 text-gray-600',   dot: 'bg-gray-400' },
  medium:   { label: 'Orta',    border: 'border-l-amber-400', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' },
  critical: { label: 'Kritik',  border: 'border-l-red-500',   badge: 'bg-red-100 text-red-700',     dot: 'bg-red-500' },
};

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const data = await svc.getAnnouncements();
      setAnnouncements(data);
      data.filter(a => !a.is_read_by_me).forEach(a => svc.markAsRead(a.id).catch(() => null));
    } finally { setLoading(false); }
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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Duyurular</h1>
        <p className="text-sm text-gray-400 mt-0.5">{announcements.length} yayında duyuru</p>
      </div>

      {announcements.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <svg className="w-24 h-24 text-gray-200 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/>
          </svg>
          <p className="text-lg font-semibold text-gray-400 mb-1">Henüz bir duyuru yayınlanmadı.</p>
          <p className="text-sm text-gray-400">Yöneticiniz duyuru yayınladığında burada görünecek.</p>
        </div>
      )}

      <div className="flex flex-col gap-6">
        {announcements.map(a => {
          const p = PRIORITY[a.priority] ?? PRIORITY.normal;
          const isCritical = a.priority === 'critical';
          return (
            <div key={a.id} className={`bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 ${p.border} ${!a.is_read_by_me ? 'ring-2 ring-indigo-100' : ''}`}>
              <div className="p-6">
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full ${p.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${p.dot}`} />
                        {p.label}
                      </span>
                      {!a.is_read_by_me && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600">Yeni</span>
                      )}
                    </div>
                    <h2 className="text-[17px] font-semibold text-[#111827] leading-snug">
                      {a.title}
                      {isCritical && (
                        <svg className="w-4 h-4 inline ml-1 -mt-0.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                        </svg>
                      )}
                    </h2>
                    <p className="text-xs text-[#6B7280] mt-1">
                      <svg className="w-3.5 h-3.5 inline mr-1 -mt-0.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2"/>
                      </svg>
                      {new Date(a.created_at).toLocaleDateString('tr-TR', {
                        year: 'numeric', month: 'long', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                      {a.created_by_name && <span className="ml-2 font-medium text-gray-500">· {a.created_by_name}</span>}
                    </p>
                  </div>
                </div>
                <p className="text-[#374151] text-sm leading-relaxed whitespace-pre-wrap">{a.content}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
