'use client';

import { useEffect, useState } from 'react';
import { Feedback, FeedbackCategory, FeedbackResponse } from '@/types';
import * as svc from '@/services/feedback';

const CATEGORIES: { value: FeedbackCategory; label: string; emoji: string }[] = [
  { value: 'temizlik', label: 'Temizlik',  emoji: '🧹' },
  { value: 'yemekler', label: 'Yemekler',  emoji: '🍽️' },
  { value: 'iecekler', label: 'İçecekler', emoji: '🥤' },
  { value: 'duzen',    label: 'Düzen',     emoji: '📐' },
  { value: 'ses',      label: 'Ses',       emoji: '🔊' },
  { value: 'personel', label: 'Personel',  emoji: '👥' },
  { value: 'genel',    label: 'Genel',     emoji: '💬' },
  { value: 'diger',    label: 'Diğer',     emoji: '📌' },
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

export default function SupervisorFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<{ category: FeedbackCategory; content: string; is_anonymous: boolean }>({
    category: 'genel', content: '', is_anonymous: false,
  });
  const [saving, setSaving] = useState(false);
  const [respondTarget, setRespondTarget] = useState<Feedback | null>(null);
  const [respValue, setRespValue] = useState<FeedbackResponse | null>(null);
  const [respNote, setRespNote] = useState('');
  const [respSaving, setRespSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try { setFeedbacks(await svc.getFeedbacks()); }
    finally { setLoading(false); }
  }

  async function submitFeedback(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await svc.createFeedback(form);
      setFeedbacks(prev => [created, ...prev]);
      setShowForm(false);
      setForm({ category: 'genel', content: '', is_anonymous: false });
    } finally { setSaving(false); }
  }

  async function submitRespond() {
    if (!respondTarget || !respValue) return;
    setRespSaving(true);
    try {
      const updated = await svc.respondToFeedback(respondTarget.id, { response: respValue, response_note: respNote });
      setFeedbacks(prev => prev.map(f => f.id === updated.id ? updated : f));
      setRespondTarget(null);
    } finally { setRespSaving(false); }
  }

  function openRespond(fb: Feedback) {
    setRespondTarget(fb);
    setRespValue(fb.response ?? null);
    setRespNote(fb.response_note ?? '');
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" /></div>;

  const total    = feedbacks.length;
  const positive = feedbacks.filter(f => f.response === 'positive').length;
  const negative = feedbacks.filter(f => f.response === 'negative').length;
  const pending  = feedbacks.filter(f => !f.response).length;
  const posRate  = total > 0 ? Math.round((positive / total) * 100) : 0;
  const negRate  = total > 0 ? Math.round((negative / total) * 100) : 0;
  const pendRate = total > 0 ? Math.round((pending  / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#F9FAFB] px-4 py-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Geri Bildirimler</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total} geri bildirim</p>
        </div>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 shadow-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
          Feedback Yaz
        </button>
      </div>

      {total > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-7">
          <div className="bg-white rounded-2xl border border-emerald-100 p-4 flex items-center gap-4 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7.493 18.75c-.425 0-.82-.236-.975-.632A7.48 7.48 0 016 15.375c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23h-.777zM2.331 10.977a11.969 11.969 0 00-.831 4.398 12 12 0 00.52 3.507c.26.85 1.084 1.368 1.973 1.368H4.9c.445 0 .72-.498.523-.898a8.963 8.963 0 01-.924-3.977c0-1.708.476-3.305 1.302-4.666.245-.403-.028-.959-.5-.959H4.25c-.832 0-1.612.453-1.918 1.227z"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-2xl font-extrabold text-emerald-600">{posRate}%</div>
              <div className="text-xs text-gray-500 font-medium">Olumlu <span className="text-gray-400">({positive})</span></div>
              <div className="w-full bg-emerald-100 rounded-full h-1 mt-1.5">
                <div className="bg-emerald-500 h-1 rounded-full" style={{ width: `${posRate}%` }} />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-red-100 p-4 flex items-center gap-4 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.73 5.25h1.035A7.465 7.465 0 0118 9.375a7.465 7.465 0 01-1.235 4.125h-.148c-.806 0-1.534.446-2.031 1.08a9.04 9.04 0 01-2.861 2.4c-.723.384-1.35.956-1.653 1.715a4.498 4.498 0 00-.322 1.672V21a.75.75 0 01-.75.75 2.25 2.25 0 01-2.25-2.25c0-1.152.26-2.243.723-3.218.266-.558-.107-1.282-.725-1.282H3.622c-1.026 0-1.945-.694-2.054-1.715A12.134 12.134 0 011.5 12c0-2.848.992-5.464 2.649-7.521.388-.482.987-.729 1.605-.729H9.77a4.5 4.5 0 011.423.23l3.114 1.04a4.5 4.5 0 001.423.23zM21.669 13.773c.536-1.362.831-2.845.831-4.398 0-1.22-.182-2.398-.52-3.507-.26-.85-1.084-1.368-1.973-1.368H19.1c-.445 0-.72.498-.523.898.591 1.2.924 2.55.924 3.977a8.959 8.959 0 01-1.302 4.666c-.245.403.028.959.5.959h1.053c.832 0 1.612-.453 1.918-1.227z"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-2xl font-extrabold text-red-500">{negRate}%</div>
              <div className="text-xs text-gray-500 font-medium">Olumsuz <span className="text-gray-400">({negative})</span></div>
              <div className="w-full bg-red-100 rounded-full h-1 mt-1.5">
                <div className="bg-red-500 h-1 rounded-full" style={{ width: `${negRate}%` }} />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-amber-100 p-4 flex items-center gap-4 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-2xl font-extrabold text-amber-500">{pendRate}%</div>
              <div className="text-xs text-gray-500 font-medium">Bekliyor <span className="text-gray-400">({pending})</span></div>
              <div className="w-full bg-amber-100 rounded-full h-1 mt-1.5">
                <div className="bg-amber-400 h-1 rounded-full" style={{ width: `${pendRate}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback list */}
      {feedbacks.length === 0 ? (
        <div className="flex flex-col items-center py-24 text-center">
          <svg className="w-20 h-20 text-gray-200 mb-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
          </svg>
          <p className="text-lg font-semibold text-gray-400">Henüz geri bildirim yok.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {feedbacks.map(fb => {
            const cat = CATEGORIES.find(c => c.value === fb.category);
            return (
              <div key={fb.id} className={`bg-white rounded-xl border shadow-sm p-5 ${fb.response === 'positive' ? 'border-emerald-200' : fb.response === 'negative' ? 'border-red-200' : 'border-gray-100'}`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {cat?.emoji} {fb.category_display}
                    </span>
                    <span className="text-sm font-medium text-gray-700">{fb.user_name}</span>
                    <span className="text-xs text-gray-400">({fb.user_role === 'supervisor' ? 'Şef' : 'Personel'})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {fb.response === 'positive' && <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700"><ThumbsUp className="w-3.5 h-3.5" /> Olumlu</span>}
                    {fb.response === 'negative' && <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700"><ThumbsDown className="w-3.5 h-3.5" /> Olumsuz</span>}
                    <button onClick={() => openRespond(fb)} className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 font-medium transition-colors">
                      {fb.response ? 'Güncelle' : 'Yanıtla'}
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{fb.content}</p>
                {fb.response && fb.response_note && (
                  <div className={`text-xs rounded-lg px-3 py-2 mt-3 ${fb.response === 'positive' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
                    <span className="font-semibold">{fb.responded_by_name}:</span> {fb.response_note}
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

      {/* Write feedback modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900">Yeni Geri Bildirim</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={submitFeedback} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Konu</label>
                <div className="grid grid-cols-4 gap-2">
                  {CATEGORIES.map(c => (
                    <button key={c.value} type="button" onClick={() => setForm({ ...form, category: c.value })}
                      className={`py-2 rounded-xl text-xs font-semibold border-2 transition-all text-center ${form.category === c.value ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                      {c.emoji}<br />{c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mesajınız</label>
                <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} required rows={4}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none" placeholder="Geri bildiriminizi yazın..." />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_anonymous} onChange={e => setForm({ ...form, is_anonymous: e.target.checked })} className="w-4 h-4 rounded" />
                <span className="text-sm text-gray-600">Anonim gönder</span>
              </label>
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">İptal</button>
                <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-60">
                  {saving ? 'Gönderiliyor...' : 'Gönder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Respond modal */}
      {respondTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setRespondTarget(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 mb-4">Yanıt Ver</h3>
            <div className="bg-gray-50 rounded-xl p-4 mb-4 text-sm text-gray-700">
              <p className="font-semibold text-gray-400 text-xs mb-1">{respondTarget.user_name} · {respondTarget.category_display}</p>
              <p>{respondTarget.content}</p>
            </div>
            <div className="flex gap-3 mb-4">
              <button onClick={() => setRespValue('positive')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold transition-all ${respValue === 'positive' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-400 hover:border-emerald-300'}`}>
                <ThumbsUp className="w-6 h-6" /> Olumlu
              </button>
              <button onClick={() => setRespValue('negative')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold transition-all ${respValue === 'negative' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-400 hover:border-red-300'}`}>
                <ThumbsDown className="w-6 h-6" /> Olumsuz
              </button>
            </div>
            <textarea value={respNote} onChange={e => setRespNote(e.target.value)} rows={3} placeholder="Not (isteğe bağlı)..."
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none mb-4" />
            <div className="flex justify-end gap-3">
              <button onClick={() => setRespondTarget(null)} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">İptal</button>
              <button onClick={submitRespond} disabled={!respValue || respSaving} className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50">
                {respSaving ? 'Kaydediliyor...' : 'Yanıtla'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
