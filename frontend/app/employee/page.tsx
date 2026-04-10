'use client';

import { useEffect, useRef, useState } from 'react';
import { Assignment, TaskCategory } from '@/types';
import * as assignmentService from '@/services/assignments';
import * as submissionService from '@/services/submissions';
import { CATEGORY_LABEL, CATEGORY_BORDER, CATEGORY_BADGE } from '@/lib/categoryStyles';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';

// ── Photo Capture Modal ──────────────────────────────────────────────────────
function PhotoModal({ assignment, onSubmit, onClose }: {
  assignment: Assignment;
  onSubmit: (id: number, photos: string[], note: string) => Promise<void>;
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const cat = assignment.task.category as TaskCategory;

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    Array.from(e.target.files ?? []).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => setPhotos(p => [...p, reader.result as string]);
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  }

  async function handleSubmit() {
    if (assignment.task.requires_photo && photos.length === 0) { setError('Bu görev için fotoğraf zorunludur.'); return; }
    setError(''); setSubmitting(true);
    try { await onSubmit(assignment.id, photos, note); }
    catch { setError('Gönderi başarısız. Tekrar deneyin.'); setSubmitting(false); }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className={`rounded-lg border ${CATEGORY_BORDER[cat]} pl-4 pr-3 py-3 bg-gray-50 flex flex-col gap-1`}>
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${CATEGORY_BADGE[cat]}`}>{CATEGORY_LABEL[cat]}</span>
          {assignment.zone && <span className="text-xs text-gray-500">{assignment.zone.name}</span>}
        </div>
        <p className="font-semibold text-sm text-gray-800">{assignment.task.title}</p>
        {assignment.task.description && <p className="text-xs text-gray-500">{assignment.task.description}</p>}
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((src, i) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
              <img src={src} alt="" className="w-full h-full object-cover" />
              <button onClick={() => setPhotos(p => p.filter((_, j) => j !== i))}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100">×</button>
            </div>
          ))}
        </div>
      )}

      <div>
        <input ref={inputRef} type="file" accept="image/*" capture="environment" multiple onChange={handleFiles} className="hidden" />
        <button onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50 rounded-xl py-4 text-sm text-gray-500 hover:text-indigo-600 transition-all flex flex-col items-center gap-1">
          <span className="text-2xl">📷</span>
          <span>{photos.length === 0 ? (assignment.task.requires_photo ? 'Fotoğraf Ekle (zorunlu)' : 'Fotoğraf Ekle (isteğe bağlı)') : '+ Daha Fazla Fotoğraf'}</span>
        </button>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">Not (isteğe bağlı)</label>
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400" />
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 p-2 rounded">{error}</p>}

      <div className="flex gap-2">
        <Button variant="secondary" onClick={onClose} className="flex-1">İptal</Button>
        <Button onClick={handleSubmit} isLoading={submitting} className="flex-1">
          Gönder {photos.length > 0 && `(${photos.length} fotoğraf)`}
        </Button>
      </div>
    </div>
  );
}

// ── Task Card ────────────────────────────────────────────────────────────────
function TaskCard({ assignment: a, onOpen, showDate }: {
  assignment: Assignment;
  onOpen: (a: Assignment) => void;
  showDate?: boolean;
}) {
  const cat = a.task.category as TaskCategory;
  const lastSub = a.submissions?.[a.submissions.length - 1];
  const wasRejected = lastSub?.approval_status === 'rejected';
  const isPending = a.status === 'pending';
  const previewPhotos = (lastSub?.photos ?? []).slice(0, 3);

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col ${CATEGORY_BORDER[cat]}`}>
      <div className="px-4 pt-3 pb-1 flex items-center justify-between">
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${CATEGORY_BADGE[cat]}`}>{CATEGORY_LABEL[cat]}</span>
        <div className="flex items-center gap-2">
          {showDate && <span className="text-[10px] text-gray-400">{a.date}</span>}
          <Badge status={a.status} />
        </div>
      </div>

      <div className="px-4 py-2 flex-1 flex flex-col gap-1.5">
        <h2 className="font-semibold text-sm text-gray-900 leading-snug">{a.task.title}</h2>
        {a.task.description && <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{a.task.description}</p>}
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500 mt-0.5">
          {a.zone && <span>📍 {a.zone.name}</span>}
          {a.task.coefficient > 1 && <span>⚡ k:{a.task.coefficient}</span>}
        </div>

        {wasRejected && lastSub?.note && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700 mt-1">
            <span className="font-semibold">Red sebebi: </span>{lastSub.note}
          </div>
        )}

        {previewPhotos.length > 0 && (
          <div className="flex gap-1 mt-1">
            {previewPhotos.map((p, i) => <img key={i} src={p.photo_url} alt="" className="w-12 h-12 rounded object-cover border border-gray-200" />)}
            {(lastSub?.photos?.length ?? 0) > 3 && (
              <div className="w-12 h-12 rounded bg-gray-100 border border-gray-200 flex items-center justify-center text-xs text-gray-500">
                +{lastSub!.photos.length - 3}
              </div>
            )}
          </div>
        )}

        {a.submissions && a.submissions.length > 1 && (
          <p className="text-xs text-gray-400">{a.submissions.length} gönderim denemesi</p>
        )}
      </div>

      {isPending && (
        <div className="px-4 pb-4 pt-1">
          <button onClick={() => onOpen(a)}
            className={`w-full py-2 rounded-lg text-sm font-semibold transition-colors ${
              a.task.requires_photo
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}>
            {wasRejected ? 'Yeniden Gönder' : a.task.requires_photo ? 'Fotoğrafla Tamamla' : 'Not Ekle & Tamamla'}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
const TR_MONTHS = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
function fmtDate(s: string) {
  const d = new Date(s + 'T12:00:00');
  return `${d.getDate()} ${TR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export default function EmployeePage() {
  const [tab, setTab] = useState<'today' | 'history'>('today');
  const [todayAssignments, setTodayAssignments] = useState<Assignment[]>([]);
  const [allAssignments, setAllAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [businessDate, setBusinessDate] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  useEffect(() => {
    async function load() {
      const [all, dateInfo] = await Promise.all([
        assignmentService.getAssignments(),
        assignmentService.getBusinessDate(),
      ]);
      setBusinessDate(dateInfo.business_date);
      setTodayAssignments(all.filter(a => a.date === dateInfo.business_date));
      setLoading(false);
    }
    load();
  }, []);

  async function loadHistory() {
    if (historyLoaded) return;
    setHistoryLoading(true);
    const all = await assignmentService.getAssignments();
    setAllAssignments(all);
    setHistoryLoaded(true);
    setHistoryLoading(false);
  }

  function handleTabChange(t: 'today' | 'history') {
    setTab(t);
    if (t === 'history') loadHistory();
  }

  async function handleSubmit(assignmentId: number, photos: string[], note: string) {
    await submissionService.createSubmission(assignmentId, photos, note);
    setTodayAssignments(prev => prev.map(a => a.id === assignmentId ? { ...a, status: 'completed' as const } : a));
    setSelectedAssignment(null);
  }

  const pending = todayAssignments.filter(a => a.status === 'pending');
  const done    = todayAssignments.filter(a => a.status !== 'pending');
  const history = allAssignments.filter(a => a.date !== businessDate);

  if (loading) return <div className="flex justify-center mt-20"><Spinner size="lg" /></div>;

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 max-w-xs">
        {(['today', 'history'] as const).map(t => (
          <button key={t} onClick={() => handleTabChange(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === t ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'today' ? 'Bugün' : 'Geçmiş'}
          </button>
        ))}
      </div>

      {/* ── TODAY TAB ── */}
      {tab === 'today' && (
        <>
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm text-gray-500">{businessDate ? fmtDate(businessDate) : ''}</p>
            <div className="flex gap-2 text-xs">
              <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 font-medium">{pending.length} bekliyor</span>
              <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">{done.length} tamamlandı</span>
            </div>
          </div>

          {todayAssignments.length === 0 ? (
            <div className="text-center text-gray-400 mt-20 flex flex-col gap-2">
              <p className="text-4xl">✓</p>
              <p>Bugün için atanmış görev yok.</p>
            </div>
          ) : (
            <>
              {pending.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Bekleyen</h2>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {pending.map(a => <TaskCard key={a.id} assignment={a} onOpen={setSelectedAssignment} />)}
                  </div>
                </div>
              )}
              {done.length > 0 && (
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Tamamlanan</h2>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {done.map(a => <TaskCard key={a.id} assignment={a} onOpen={setSelectedAssignment} />)}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── HISTORY TAB ── */}
      {tab === 'history' && (
        <>
          {historyLoading ? (
            <div className="flex justify-center mt-20"><Spinner size="lg" /></div>
          ) : history.length === 0 ? (
            <div className="text-center text-gray-400 mt-20 flex flex-col gap-2">
              <p className="text-4xl">📋</p>
              <p>Henüz geçmiş görev yok.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {history.map(a => {
                const cat = a.task.category as TaskCategory;
                const description = a.task.description;
                return (
                  <div key={a.id} className={`bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden ${CATEGORY_BORDER[cat]}`}>
                    <div className="flex items-start gap-4 px-4 py-3">
                      <div className="min-w-[64px] text-center bg-gray-50 rounded-lg px-2 py-1.5 shrink-0">
                        <p className="text-[10px] text-gray-400 uppercase leading-none mb-0.5">
                          {new Date(a.date + 'T12:00:00').toLocaleDateString('tr-TR', { month: 'short' })}
                        </p>
                        <p className="text-xl font-black text-gray-800 leading-none">
                          {new Date(a.date + 'T12:00:00').getDate()}
                        </p>
                        <p className="text-[10px] text-gray-400 leading-none mt-0.5">
                          {new Date(a.date + 'T12:00:00').toLocaleDateString('tr-TR', { weekday: 'short' })}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-sm text-gray-900 leading-snug">{a.task.title}</p>
                          <Badge status={a.status} />
                        </div>
                        {description && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{description}</p>}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                          {a.zone && <span className="text-xs text-gray-500">📍 {a.zone.name}</span>}
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${CATEGORY_BADGE[cat]}`}>
                            {CATEGORY_LABEL[cat]}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <Modal isOpen={!!selectedAssignment} onClose={() => setSelectedAssignment(null)} title="Görevi Tamamla">
        {selectedAssignment && (
          <PhotoModal assignment={selectedAssignment} onSubmit={handleSubmit} onClose={() => setSelectedAssignment(null)} />
        )}
      </Modal>
    </div>
  );
}
