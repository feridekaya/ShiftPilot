'use client';

import { useEffect, useState } from 'react';
import { Feedback, FeedbackCategory } from '@/types';
import * as svc from '@/services/feedback';

const CATEGORIES: { value: FeedbackCategory; label: string; emoji: string; desc: string }[] = [
  { value: 'temizlik', label: 'Temizlik',  emoji: '🧹', desc: 'Hijyen, düzensizlik' },
  { value: 'yemekler', label: 'Yemekler',  emoji: '🍽️', desc: 'Yemek kalitesi, porsiyon' },
  { value: 'iecekler', label: 'İçecekler', emoji: '🥤', desc: 'Sıcak/soğuk içecekler' },
  { value: 'duzen',    label: 'Düzen',     emoji: '📐', desc: 'Masa dizilimi, alan' },
  { value: 'ses',      label: 'Ses',       emoji: '🔊', desc: 'Gürültü, müzik' },
  { value: 'personel', label: 'Personel',  emoji: '👥', desc: 'Davranış, hizmet' },
  { value: 'genel',    label: 'Genel',     emoji: '💬', desc: 'Genel geri bildirim' },
  { value: 'diger',    label: 'Diğer',     emoji: '📌', desc: 'Diğer konular' },
];

function ThumbsUp({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M7.493 18.75c-.425 0-.82-.236-.975-.632A7.48 7.48 0 016 15.375c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23h-.777zM2.331 10.977a11.969 11.969 0 00-.831 4.398 12 12 0 00.52 3.507c.26.85 1.084 1.368 1.973 1.368H4.9c.445 0 .72-.498.523-.898a8.963 8.963 0 01-.924-3.977c0-1.708.476-3.305 1.302-4.666.245-.403-.028-.959-.5-.959H4.25c-.832 0-1.612.453-1.918 1.227z"/>
    </svg>
  );
}

function ThumbsDown({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M15.73 5.25h1.035A7.465 7.465 0 0118 9.375a7.465 7.465 0 01-1.235 4.125h-.148c-.806 0-1.534.446-2.031 1.08a9.04 9.04 0 01-2.861 2.4c-.723.384-1.35.956-1.653 1.715a4.498 4.498 0 00-.322 1.672V21a.75.75 0 01-.75.75 2.25 2.25 0 01-2.25-2.25c0-1.152.26-2.243.723-3.218.266-.558-.107-1.282-.725-1.282H3.622c-1.026 0-1.945-.694-2.054-1.715A12.134 12.134 0 011.5 12c0-2.848.992-5.464 2.649-7.521.388-.482.987-.729 1.605-.729H9.77a4.5 4.5 0 011.423.23l3.114 1.04a4.5 4.5 0 001.423.23zM21.669 13.773c.536-1.362.831-2.845.831-4.398 0-1.22-.182-2.398-.52-3.507-.26-.85-1.084-1.368-1.973-1.368H19.1c-.445 0-.72.498-.523.898.591 1.2.924 2.55.924 3.977a8.959 8.959 0 01-1.302 4.666c-.245.403.028.959.5.959h1.053c.832 0 1.612-.453 1.918-1.227z"/>
    </svg>
  );
}

export default function EmployeeFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<FeedbackCategory | null>(null);
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try { setFeedbacks(await svc.getFeedbacks()); }
    finally { setLoading(false); }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      const created = await svc.createFeedback({ category: selected, content, is_anonymous: isAnonymous });
      setFeedbacks(prev => [created, ...prev]);
      setShowForm(false);
      setSelected(null);
      setContent('');
      setIsAnonymous(false);
    } finally { setSaving(false); }
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] px-4 py-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Geri Bildirim</h1>
          <p className="text-sm text-gray-400 mt-0.5">Düşüncelerini yönetiminle paylaş</p>
        </div>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 shadow-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
          Yeni Bildirim
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" /></div>
      ) : feedbacks.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <svg className="w-20 h-20 text-gray-200 mb-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
          </svg>
          <p className="text-lg font-semibold text-gray-400 mb-1">Henüz geri bildirim göndermediniz.</p>
          <button onClick={() => setShowForm(true)} className="mt-4 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700">İlk bildirimi gönder</button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {feedbacks.map(fb => {
            const cat = CATEGORIES.find(c => c.value === fb.category);
            return (
              <div key={fb.id} className={`bg-white rounded-xl border shadow-sm p-5 ${fb.response === 'positive' ? 'border-l-4 border-l-emerald-400' : fb.response === 'negative' ? 'border-l-4 border-l-red-400' : 'border-gray-100'}`}>
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {cat?.emoji} {fb.category_display}
                  </span>
                  {fb.is_anonymous && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Anonim</span>}
                  {!fb.response && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">Yanıt bekleniyor</span>}
                  {fb.response === 'positive' && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                      <ThumbsUp className="w-3.5 h-3.5" /> Olumlu
                    </span>
                  )}
                  {fb.response === 'negative' && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700">
                      <ThumbsDown className="w-3.5 h-3.5" /> Olumsuz
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{fb.content}</p>
                {fb.response && fb.response_note && (
                  <div className={`text-xs rounded-lg px-3 py-2.5 mt-3 ${fb.response === 'positive' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
                    <p className="font-semibold mb-0.5">{fb.responded_by_name} yanıtladı:</p>
                    <p>{fb.response_note}</p>
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-50">
                  {new Date(fb.created_at).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900">Geri Bildirim Gönder</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={submit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Konu seç</label>
                <div className="grid grid-cols-4 gap-2">
                  {CATEGORIES.map(c => (
                    <button key={c.value} type="button" onClick={() => setSelected(c.value)}
                      className={`py-2.5 px-1 rounded-xl text-center text-xs font-semibold border-2 transition-all ${selected === c.value ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                      <div className="text-lg mb-0.5">{c.emoji}</div>
                      {c.label}
                    </button>
                  ))}
                </div>
                {selected && (
                  <p className="text-xs text-gray-400 mt-1.5">
                    {CATEGORIES.find(c => c.value === selected)?.desc}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mesajınız</label>
                <textarea value={content} onChange={e => setContent(e.target.value)} required rows={4}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  placeholder="Düşüncelerinizi açıkça paylaşın..." />
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer p-3 rounded-xl border border-gray-100 hover:bg-gray-50">
                <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} className="w-4 h-4 rounded text-indigo-600" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Anonim gönder</p>
                  <p className="text-xs text-gray-400">İsminiz gizli tutulur</p>
                </div>
              </label>
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">İptal</button>
                <button type="submit" disabled={!selected || saving} className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-60">
                  {saving ? 'Gönderiliyor...' : 'Gönder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
