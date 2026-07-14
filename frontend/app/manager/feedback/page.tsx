'use client';

import { useEffect, useState } from 'react';
import { Feedback, FeedbackCategory, FeedbackResponse } from '@/types';
import * as svc from '@/services/feedback';
import type { FeedbackStats, FeedbackPeriodStats } from '@/services/feedback';

const CATEGORIES: { value: FeedbackCategory | 'all'; label: string; emoji: string }[] = [
  { value: 'all',       label: 'Tümü',      emoji: '📋' },
  { value: 'temizlik',  label: 'Temizlik',   emoji: '🧹' },
  { value: 'yemekler',  label: 'Yemekler',   emoji: '🍽️' },
  { value: 'iecekler',  label: 'İçecekler',  emoji: '🥤' },
  { value: 'duzen',     label: 'Düzen',      emoji: '📐' },
  { value: 'ses',       label: 'Ses',        emoji: '🔊' },
  { value: 'personel',  label: 'Personel',   emoji: '👥' },
  { value: 'genel',     label: 'Genel',      emoji: '💬' },
  { value: 'diger',     label: 'Diğer',      emoji: '📌' },
];

const RESPONSE_FILTERS = [
  { value: 'all',      label: 'Tümü' },
  { value: 'pending',  label: 'Yanıt Bekliyor' },
  { value: 'positive', label: 'Olumlu' },
  { value: 'negative', label: 'Olumsuz' },
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

interface RespondModalProps {
  feedback: Feedback;
  onClose: () => void;
  onDone: (updated: Feedback) => void;
}

function RespondModal({ feedback, onClose, onDone }: RespondModalProps) {
  const [response, setResponse] = useState<FeedbackResponse | null>(feedback.response ?? null);
  const [note, setNote] = useState(feedback.response_note ?? '');
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!response) return;
    setSaving(true);
    try {
      const updated = await svc.respondToFeedback(feedback.id, { response, response_note: note });
      onDone(updated);
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">Geri Bildirim Ver</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Original feedback */}
        <div className="bg-gray-50 rounded-xl p-4 mb-5 text-sm text-gray-700">
          <p className="font-semibold text-gray-500 text-xs mb-1">{feedback.user_name} · {feedback.category_display}</p>
          {feedback.customer_rating && (
            <div className="flex items-center gap-0.5 mb-2">
              {[1,2,3,4,5].map(s => (
                <svg key={s} className={`w-4 h-4 ${s <= feedback.customer_rating! ? 'text-amber-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              ))}
              <span className="ml-1 text-xs text-amber-600 font-semibold">Müşteri puanı: {feedback.customer_rating}/5</span>
            </div>
          )}
          <p className="leading-relaxed">{feedback.content}</p>
        </div>

        {/* Process management label */}
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          Süreç Yönetimi Değerlendirmesi
        </p>
        <p className="text-xs text-gray-400 mb-3">
          Aşağıdaki değerlendirme müşteri puanını değil, süreç yönetiminin nasıl ele alındığını yansıtır.
        </p>

        {/* Response buttons */}
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => setResponse('positive')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold transition-all ${
              response === 'positive' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-400 hover:border-emerald-300'
            }`}
          >
            <ThumbsUp className="w-6 h-6" /> Olumlu
          </button>
          <button
            onClick={() => setResponse('negative')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold transition-all ${
              response === 'negative' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-400 hover:border-red-300'
            }`}
          >
            <ThumbsDown className="w-6 h-6" /> Olumsuz
          </button>
        </div>

        {/* Note */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Not (isteğe bağlı)</label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={3}
            placeholder="Personele iletmek istediğiniz not..."
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">İptal</button>
          <button
            onClick={submit}
            disabled={!response || saving}
            className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Kaydediliyor...' : 'Yanıtla'}
          </button>
        </div>
      </div>
    </div>
  );
}

function FeedbackCard({ fb, onRespond }: { fb: Feedback; onRespond: () => void }) {
  const cat = CATEGORIES.find(c => c.value === fb.category);
  return (
    <div className={`bg-white rounded-xl border shadow-sm p-5 ${
      fb.response === 'positive' ? 'border-emerald-200' : fb.response === 'negative' ? 'border-red-200' : 'border-gray-100'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
            {cat?.emoji} {fb.category_display}
          </span>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
              {fb.user_name.charAt(0)}
            </div>
            <span className="text-sm font-medium text-gray-700">{fb.user_name}</span>
            <span className="text-xs text-gray-400 capitalize">({fb.user_role === 'supervisor' ? 'Şef' : 'Personel'})</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
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
          <button
            onClick={onRespond}
            className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 font-medium transition-colors"
          >
            {fb.response ? 'Güncelle' : 'Yanıtla'}
          </button>
        </div>
      </div>

      {fb.customer_rating && (
        <div className="flex items-center gap-0.5 mb-2">
          {[1,2,3,4,5].map(s => (
            <svg key={s} className={`w-4 h-4 ${s <= fb.customer_rating! ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          ))}
          <span className="ml-1 text-xs text-amber-600 font-semibold">{fb.customer_rating}/5</span>
        </div>
      )}
      <p className="text-sm text-gray-700 leading-relaxed mb-3">{fb.content}</p>

      {/* Response note */}
      {fb.response && fb.response_note && (
        <div className={`text-xs rounded-lg px-3 py-2 mt-2 ${fb.response === 'positive' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
          <span className="font-semibold">{fb.responded_by_name}:</span> {fb.response_note}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-gray-50 text-xs text-gray-400">
        {new Date(fb.created_at).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        {fb.responded_at && <span className="ml-3">· Yanıtlandı: {new Date(fb.responded_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>}
      </div>
    </div>
  );
}

type Period = 'today' | 'week' | 'month' | 'overall';
const PERIODS: { key: Period; label: string }[] = [
  { key: 'today',   label: 'Günlük' },
  { key: 'week',    label: 'Haftalık' },
  { key: 'month',   label: 'Aylık' },
  { key: 'overall', label: 'Genel' },
];

function StarRow({ avg, count }: { avg: number | null; count: number }) {
  const filled = avg !== null ? Math.round(avg) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-0.5">
        {[1,2,3,4,5].map(s => (
          <svg key={s} className={`w-5 h-5 ${s <= filled ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        ))}
      </div>
      <span className="text-2xl font-extrabold text-gray-800">
        {avg !== null ? avg.toFixed(1) : '—'}
      </span>
      <span className="text-sm text-gray-400">{count > 0 ? `${count} değerlendirme` : 'Henüz yok'}</span>
    </div>
  );
}

function PeriodTabs({ active, onChange }: { active: Period; onChange: (p: Period) => void }) {
  return (
    <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
      {PERIODS.map(p => (
        <button
          key={p.key}
          onClick={() => onChange(p.key)}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            active === p.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

function PersonnelStatCards({ data }: { data: FeedbackPeriodStats['personnel'] }) {
  const { positive, negative, pending, total } = data;
  const posRate  = total > 0 ? Math.round((positive / total) * 100) : 0;
  const negRate  = total > 0 ? Math.round((negative / total) * 100) : 0;
  const pendRate = total > 0 ? Math.round((pending  / total) * 100) : 0;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="bg-white rounded-2xl border border-emerald-100 p-4 flex items-center gap-3 shadow-sm">
        <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M7.493 18.75c-.425 0-.82-.236-.975-.632A7.48 7.48 0 016 15.375c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23h-.777zM2.331 10.977a11.969 11.969 0 00-.831 4.398 12 12 0 00.52 3.507c.26.85 1.084 1.368 1.973 1.368H4.9c.445 0 .72-.498.523-.898a8.963 8.963 0 01-.924-3.977c0-1.708.476-3.305 1.302-4.666.245-.403-.028-.959-.5-.959H4.25c-.832 0-1.612.453-1.918 1.227z"/>
          </svg>
        </div>
        <div>
          <div className="text-xl font-extrabold text-emerald-600">{posRate}%</div>
          <div className="text-xs text-gray-500 font-medium">Olumlu <span className="text-gray-400">({positive})</span></div>
          <div className="w-full bg-emerald-100 rounded-full h-1 mt-1.5"><div className="bg-emerald-500 h-1 rounded-full transition-all" style={{ width: `${posRate}%` }} /></div>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-red-100 p-4 flex items-center gap-3 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M15.73 5.25h1.035A7.465 7.465 0 0118 9.375a7.465 7.465 0 01-1.235 4.125h-.148c-.806 0-1.534.446-2.031 1.08a9.04 9.04 0 01-2.861 2.4c-.723.384-1.35.956-1.653 1.715a4.498 4.498 0 00-.322 1.672V21a.75.75 0 01-.75.75 2.25 2.25 0 01-2.25-2.25c0-1.152.26-2.243.723-3.218.266-.558-.107-1.282-.725-1.282H3.622c-1.026 0-1.945-.694-2.054-1.715A12.134 12.134 0 011.5 12c0-2.848.992-5.464 2.649-7.521.388-.482.987-.729 1.605-.729H9.77a4.5 4.5 0 011.423.23l3.114 1.04a4.5 4.5 0 001.423.23zM21.669 13.773c.536-1.362.831-2.845.831-4.398 0-1.22-.182-2.398-.52-3.507-.26-.85-1.084-1.368-1.973-1.368H19.1c-.445 0-.72.498-.523.898.591 1.2.924 2.55.924 3.977a8.959 8.959 0 01-1.302 4.666c-.245.403.028.959.5.959h1.053c.832 0 1.612-.453 1.918-1.227z"/>
          </svg>
        </div>
        <div>
          <div className="text-xl font-extrabold text-red-500">{negRate}%</div>
          <div className="text-xs text-gray-500 font-medium">Olumsuz <span className="text-gray-400">({negative})</span></div>
          <div className="w-full bg-red-100 rounded-full h-1 mt-1.5"><div className="bg-red-500 h-1 rounded-full transition-all" style={{ width: `${negRate}%` }} /></div>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-amber-100 p-4 flex items-center gap-3 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <div>
          <div className="text-xl font-extrabold text-amber-500">{pendRate}%</div>
          <div className="text-xs text-gray-500 font-medium">Bekliyor <span className="text-gray-400">({pending})</span></div>
          <div className="w-full bg-amber-100 rounded-full h-1 mt-1.5"><div className="bg-amber-400 h-1 rounded-full transition-all" style={{ width: `${pendRate}%` }} /></div>
        </div>
      </div>
    </div>
  );
}

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [responseFilter, setResponseFilter] = useState<string>('all');
  const [respondTarget, setRespondTarget] = useState<Feedback | null>(null);
  const [customerPeriod, setCustomerPeriod] = useState<Period>('today');
  const [personnelPeriod, setPersonnelPeriod] = useState<Period>('today');

  useEffect(() => {
    svc.getFeedbackStats().then(setStats).catch(() => {});
  }, []);

  useEffect(() => { loadList(); }, [categoryFilter, responseFilter]);

  async function loadList() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (responseFilter !== 'all') params.response = responseFilter;
      setFeedbacks(await svc.getFeedbacks(params));
    } finally { setLoading(false); }
  }

  function handleResponded(updated: Feedback) {
    setFeedbacks(prev => prev.map(f => f.id === updated.id ? updated : f));
    setRespondTarget(null);
    svc.getFeedbackStats().then(setStats).catch(() => {});
  }

  const customerData = stats?.[customerPeriod]?.customer ?? null;
  const personnelData = stats?.[personnelPeriod]?.personnel ?? null;
  const totalListCount = feedbacks.length;

  return (
    <div className="min-h-screen bg-[#F9FAFB] px-4 py-8 max-w-4xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Geri Bildirimler</h1>
      </div>

      {/* ── Müşteri Değerlendirmeleri ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Müşteri Değerlendirmeleri</h2>
            <p className="text-xs text-gray-400 mt-0.5">Müşterilerden gelen yıldız puanı ortalaması</p>
          </div>
          <PeriodTabs active={customerPeriod} onChange={setCustomerPeriod} />
        </div>
        {customerData ? (
          <StarRow avg={customerData.avg} count={customerData.count} />
        ) : (
          <div className="h-8 flex items-center">
            <div className="animate-pulse w-40 h-6 bg-gray-100 rounded" />
          </div>
        )}
      </div>

      {/* ── Personel Feedback Yönetimi ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Personel Feedback Yönetimi</h2>
            <p className="text-xs text-gray-400 mt-0.5">Süreç değerlendirme oranları</p>
          </div>
          <PeriodTabs active={personnelPeriod} onChange={setPersonnelPeriod} />
        </div>
        {personnelData ? (
          <PersonnelStatCards data={personnelData} />
        ) : (
          <div className="h-20 flex items-center">
            <div className="animate-pulse w-full h-16 bg-gray-100 rounded-2xl" />
          </div>
        )}
      </div>

      {/* ── Feedback listesi ── */}
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Tüm Geri Bildirimler</h3>
        <span className="text-xs text-gray-400">({totalListCount})</span>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap mb-3">
        {CATEGORIES.map(c => (
          <button
            key={c.value}
            onClick={() => setCategoryFilter(c.value)}
            className={`text-xs px-3 py-1.5 rounded-xl font-semibold border transition-all ${
              categoryFilter === c.value ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
            }`}
          >
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {/* Response filter */}
      <div className="flex gap-2 mb-6">
        {RESPONSE_FILTERS.map(r => (
          <button
            key={r.value}
            onClick={() => setResponseFilter(r.value)}
            className={`text-xs px-3 py-1.5 rounded-xl font-semibold border transition-all ${
              responseFilter === r.value ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" /></div>
      ) : feedbacks.length === 0 ? (
        <div className="flex flex-col items-center py-24 text-center">
          <svg className="w-20 h-20 text-gray-200 mb-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
          </svg>
          <p className="text-lg font-semibold text-gray-400">Geri bildirim bulunamadı.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {feedbacks.map(fb => (
            <FeedbackCard key={fb.id} fb={fb} onRespond={() => setRespondTarget(fb)} />
          ))}
        </div>
      )}

      {respondTarget && (
        <RespondModal
          feedback={respondTarget}
          onClose={() => setRespondTarget(null)}
          onDone={handleResponded}
        />
      )}
    </div>
  );
}
