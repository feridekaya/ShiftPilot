'use client';

import { useEffect, useState } from 'react';
import { TaskSubmission, TaskCategory } from '@/types';
import * as submissionService from '@/services/submissions';
import { CATEGORY_LABEL, CATEGORY_BADGE, CATEGORY_BORDER } from '@/lib/categoryStyles';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

// ── Star Rating ───────────────────────────────────────────────────────────────
function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star === value ? 0 : star)}
          className="text-2xl leading-none transition-transform hover:scale-110 focus:outline-none"
        >
          <span className={(hover || value) >= star ? 'text-amber-400' : 'text-gray-200'}>★</span>
        </button>
      ))}
      {value > 0 && (
        <span className="text-xs text-gray-400 ml-1">{value}/5</span>
      )}
    </div>
  );
}

export default function SupervisorPage() {
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteMap, setNoteMap] = useState<Record<number, string>>({});
  const [ratingMap, setRatingMap] = useState<Record<number, number>>({});
  const [processing, setProcessing] = useState<number | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    submissionService.getSubmissions({ status: 'pending' })
      .then(setSubmissions)
      .finally(() => setLoading(false));
  }, []);

  async function handleApprove(id: number) {
    setProcessing(id);
    await submissionService.approveSubmission(id, noteMap[id], ratingMap[id]);
    setSubmissions(prev => prev.filter(s => s.id !== id));
    setProcessing(null);
  }

  async function handleReject(id: number) {
    if (!noteMap[id]?.trim()) { alert('Red sebebi belirtiniz.'); return; }
    setProcessing(id);
    await submissionService.rejectSubmission(id, noteMap[id]);
    setSubmissions(prev => prev.filter(s => s.id !== id));
    setProcessing(null);
  }

  if (loading) return <div className="flex justify-center mt-20"><Spinner size="lg" /></div>;

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Onay Bekleyen Göndermeler ({submissions.length})</h1>

      {submissions.length === 0 && (
        <div className="text-center text-gray-400 mt-20 flex flex-col gap-2">
          <p className="text-4xl">✓</p>
          <p>Onay bekleyen gönderi yok.</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {submissions.map(s => {
          const cat = (s.assignment.task_category ?? 'general') as TaskCategory;
          const allPhotos = s.photos?.length ? s.photos : (s.photo_url ? [{ id: 0, photo_url: s.photo_url, order: 0 }] : []);

          return (
            <div key={s.id} className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col ${CATEGORY_BORDER[cat]}`}>
              {/* Header */}
              <div className="px-4 pt-3 pb-2 border-b border-gray-100">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${CATEGORY_BADGE[cat]}`}>
                    {CATEGORY_LABEL[cat]}
                  </span>
                  <span className="text-xs text-gray-400">{s.assignment.date}</span>
                </div>
                <p className="font-semibold text-gray-800 text-sm">{s.assignment.task_title}</p>
                {s.assignment.task_description && (
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{s.assignment.task_description}</p>
                )}
                <div className="flex gap-3 text-xs text-gray-400 mt-1.5">
                  <span className="font-medium text-gray-700">{s.assignment.user.name}</span>
                  {s.assignment.zone_name && <span>📍 {s.assignment.zone_name}</span>}
                  {s.assignment.shift_name && <span>🕐 {s.assignment.shift_name}</span>}
                </div>
              </div>

              {/* Photo gallery */}
              {allPhotos.length > 0 && (
                <div className={`p-2 ${allPhotos.length === 1 ? '' : 'grid grid-cols-3 gap-1.5'}`}>
                  {allPhotos.map((p, i) => (
                    <button
                      key={p.id || i}
                      onClick={() => setLightbox(p.photo_url)}
                      className="relative rounded-lg overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity"
                      style={{ aspectRatio: allPhotos.length === 1 ? '16/9' : '1' }}
                    >
                      <img src={p.photo_url} alt={`Fotoğraf ${i + 1}`} className="w-full h-full object-cover" />
                      {allPhotos.length > 1 && (
                        <span className="absolute bottom-1 right-1 text-[9px] bg-black/50 text-white px-1 rounded">#{i + 1}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Staff note */}
              {s.staff_note && (
                <div className="mx-3 mb-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800">
                  <span className="font-semibold">Personel notu: </span>{s.staff_note}
                </div>
              )}

              <p className="px-4 text-xs text-gray-400 mb-2">
                Gönderildi: {new Date(s.submitted_at).toLocaleString('tr-TR')}
              </p>

              {/* Review area */}
              <div className="px-4 pb-4 flex flex-col gap-2 mt-auto">
                {/* Star rating */}
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-gray-500 font-medium">Puan (onaylamak için isteğe bağlı)</span>
                  <StarRating
                    value={ratingMap[s.id] ?? 0}
                    onChange={v => setRatingMap(prev => ({ ...prev, [s.id]: v }))}
                  />
                </div>

                <textarea
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  rows={2}
                  placeholder="Not (red için zorunlu)..."
                  value={noteMap[s.id] ?? ''}
                  onChange={e => setNoteMap(prev => ({ ...prev, [s.id]: e.target.value }))}
                />
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" className="flex-1 justify-center" isLoading={processing === s.id} onClick={() => handleApprove(s.id)}>
                    ✓ Onayla
                  </Button>
                  <Button variant="danger" size="sm" className="flex-1 justify-center" isLoading={processing === s.id} onClick={() => handleReject(s.id)}>
                    ✕ Reddet
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="Büyük fotoğraf" className="max-w-full max-h-full rounded-xl shadow-2xl" onClick={e => e.stopPropagation()} />
          <button onClick={() => setLightbox(null)} className="absolute top-4 right-4 text-white text-2xl w-9 h-9 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/80">×</button>
        </div>
      )}
    </div>
  );
}
