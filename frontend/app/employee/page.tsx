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

// ── Photo Capture Modal ─────────────────────────────────────────────────────
interface PhotoModalProps {
  assignment: Assignment;
  onSubmit: (assignmentId: number, photos: string[], note: string) => Promise<void>;
  onClose: () => void;
}

function PhotoModal({ assignment, onSubmit, onClose }: PhotoModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => setPhotos(p => [...p, reader.result as string]);
      reader.readAsDataURL(file);
    });
    // Reset so same files can be added again if needed
    e.target.value = '';
  }

  function removePhoto(idx: number) {
    setPhotos(p => p.filter((_, i) => i !== idx));
  }

  async function handleSubmit() {
    if (photos.length === 0) { setError('En az bir fotoğraf ekleyin.'); return; }
    setError('');
    setSubmitting(true);
    try {
      await onSubmit(assignment.id, photos, note);
    } catch {
      setError('Gönderi başarısız. Tekrar deneyin.');
      setSubmitting(false);
    }
  }

  const cat = assignment.task.category as TaskCategory;

  return (
    <div className="flex flex-col gap-4">
      {/* Task info */}
      <div className={`rounded-lg border ${CATEGORY_BORDER[cat]} pl-4 pr-3 py-3 bg-gray-50 flex flex-col gap-1`}>
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${CATEGORY_BADGE[cat]}`}>
            {CATEGORY_LABEL[cat]}
          </span>
          {assignment.zone && <span className="text-xs text-gray-500">{assignment.zone.name}</span>}
        </div>
        <p className="font-semibold text-sm text-gray-800">{assignment.task.title}</p>
        {assignment.task.description && (
          <p className="text-xs text-gray-500">{assignment.task.description}</p>
        )}
      </div>

      {/* Photo gallery */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((src, i) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
              <img src={src} alt={`Fotoğraf ${i + 1}`} className="w-full h-full object-cover" />
              <button
                onClick={() => removePhoto(i)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
              <span className="absolute bottom-1 left-1 text-[10px] bg-black/50 text-white px-1 rounded">
                #{i + 1}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Add photos button */}
      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          onChange={handleFiles}
          className="hidden"
        />
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50 rounded-xl py-4 text-sm text-gray-500 hover:text-indigo-600 transition-all flex flex-col items-center gap-1"
        >
          <span className="text-2xl">📷</span>
          <span>{photos.length === 0 ? 'Fotoğraf Ekle' : '+ Daha Fazla Fotoğraf'}</span>
          <span className="text-xs text-gray-400">Birden fazla seçebilirsiniz</span>
        </button>
      </div>

      {/* Staff note */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">Not / Açıklama (isteğe bağlı)</label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={3}
          placeholder="Görevle ilgili eklemek istediğiniz notlar..."
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
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

// ── Main page ───────────────────────────────────────────────────────────────
export default function EmployeePage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [businessDate, setBusinessDate] = useState('');

  useEffect(() => {
    async function load() {
      const [all, dateInfo] = await Promise.all([
        assignmentService.getAssignments(),
        assignmentService.getBusinessDate(),
      ]);
      setBusinessDate(dateInfo.business_date);
      setAssignments(all.filter(a => a.date === dateInfo.business_date));
      setLoading(false);
    }
    load();
  }, []);

  async function handleSubmit(assignmentId: number, photos: string[], note: string) {
    await submissionService.createSubmission(assignmentId, photos, note);
    setAssignments(prev =>
      prev.map(a => a.id === assignmentId ? { ...a, status: 'completed' } : a)
    );
    setSelectedAssignment(null);
  }

  const TR_MONTHS = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
  function fmtDate(s: string) {
    const d = new Date(s + 'T12:00:00');
    return `${d.getDate()} ${TR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }

  if (loading) return <div className="flex justify-center mt-20"><Spinner size="lg" /></div>;

  const pending   = assignments.filter(a => a.status === 'pending');
  const done      = assignments.filter(a => a.status !== 'pending');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Bugünkü Görevlerim</h1>
          <p className="text-sm text-gray-500 mt-0.5">{businessDate ? fmtDate(businessDate) : ''}</p>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 font-medium">{pending.length} bekliyor</span>
          <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">{done.length} tamamlandı</span>
        </div>
      </div>

      {assignments.length === 0 && (
        <div className="text-center text-gray-400 mt-20 flex flex-col gap-2">
          <p className="text-4xl">✓</p>
          <p>Bugün için atanmış görev yok.</p>
        </div>
      )}

      {/* Pending tasks */}
      {pending.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Bekleyen Görevler</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pending.map(a => <TaskCard key={a.id} assignment={a} onOpen={setSelectedAssignment} />)}
          </div>
        </div>
      )}

      {/* Done tasks */}
      {done.length > 0 && (
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Tamamlanan Görevler</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {done.map(a => <TaskCard key={a.id} assignment={a} onOpen={setSelectedAssignment} />)}
          </div>
        </div>
      )}

      <Modal
        isOpen={!!selectedAssignment}
        onClose={() => setSelectedAssignment(null)}
        title="Görevi Tamamla"
      >
        {selectedAssignment && (
          <PhotoModal
            assignment={selectedAssignment}
            onSubmit={handleSubmit}
            onClose={() => setSelectedAssignment(null)}
          />
        )}
      </Modal>
    </div>
  );
}

// ── Task Card ───────────────────────────────────────────────────────────────
function TaskCard({ assignment: a, onOpen }: { assignment: Assignment; onOpen: (a: Assignment) => void }) {
  const cat = a.task.category as TaskCategory;
  const lastSub = a.submissions?.[a.submissions.length - 1];
  const wasRejected = lastSub?.approval_status === 'rejected';
  const isPending = a.status === 'pending';

  // Last submission photos for quick preview
  const previewPhotos = (lastSub?.photos ?? []).slice(0, 3);

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col ${CATEGORY_BORDER[cat]}`}>
      {/* Category tag */}
      <div className="px-4 pt-3 pb-1 flex items-center justify-between">
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${CATEGORY_BADGE[cat]}`}>
          {CATEGORY_LABEL[cat]}
        </span>
        <Badge status={a.status} />
      </div>

      {/* Content */}
      <div className="px-4 py-2 flex-1 flex flex-col gap-1.5">
        <h2 className="font-semibold text-sm text-gray-900 leading-snug">{a.task.title}</h2>

        {a.task.description && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{a.task.description}</p>
        )}

        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500 mt-0.5">
          {a.zone && <span>📍 {a.zone.name}</span>}
          {a.shift && <span>🕐 {a.shift.name}</span>}
          {a.task.coefficient > 1 && <span>⚡ k:{a.task.coefficient}</span>}
        </div>

        {/* Rejection note */}
        {wasRejected && lastSub?.note && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700 mt-1">
            <span className="font-semibold">Red sebebi: </span>{lastSub.note}
          </div>
        )}

        {/* Photo thumbnails from last submission */}
        {previewPhotos.length > 0 && (
          <div className="flex gap-1 mt-1">
            {previewPhotos.map((p, i) => (
              <img key={i} src={p.photo_url} alt="" className="w-12 h-12 rounded object-cover border border-gray-200" />
            ))}
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

      {/* Action */}
      {isPending && (
        <div className="px-4 pb-4 pt-1">
          {a.task.requires_photo ? (
            <button
              onClick={() => onOpen(a)}
              className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors"
            >
              {wasRejected ? 'Yeniden Gönder' : 'Fotoğrafla Tamamla'}
            </button>
          ) : (
            <button
              onClick={() => onOpen(a)}
              className="w-full py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold transition-colors"
            >
              Not Ekle & Tamamla
            </button>
          )}
        </div>
      )}
    </div>
  );
}
