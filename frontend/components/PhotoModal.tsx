'use client';

import { useRef, useState } from 'react';
import { Assignment, TaskCategory } from '@/types';
import { uploadPhoto } from '@/services/submissions';
import { CATEGORY_LABEL, CATEGORY_BORDER, CATEGORY_BADGE } from '@/lib/categoryStyles';
import Button from '@/components/ui/Button';

interface UploadingPhoto {
  previewUrl: string;   // local blob URL — shown instantly
  uploadedUrl: string | null;  // R2 URL once done
  uploading: boolean;
  error: boolean;
}

export default function PhotoModal({ assignment, onSubmit, onClose }: {
  assignment: Assignment;
  onSubmit: (id: number, photoUrls: string[], note: string) => Promise<void>;
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<UploadingPhoto[]>([]);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const cat = assignment.task.category as TaskCategory;

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';

    files.forEach(file => {
      const previewUrl = URL.createObjectURL(file);

      setPhotos(prev => {
        const newIdx = prev.length;
        const newPhoto: UploadingPhoto = { previewUrl, uploadedUrl: null, uploading: true, error: false };
        const next = [...prev, newPhoto];

        // Upload immediately
        uploadPhoto(file)
          .then(url => {
            setPhotos(p => p.map((ph, i) => i === newIdx ? { ...ph, uploadedUrl: url, uploading: false } : ph));
          })
          .catch(() => {
            setPhotos(p => p.map((ph, i) => i === newIdx ? { ...ph, uploading: false, error: true } : ph));
          });

        return next;
      });
    });
  }

  function removePhoto(idx: number) {
    setPhotos(prev => {
      URL.revokeObjectURL(prev[idx].previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
  }

  async function handleSubmit() {
    const stillUploading = photos.some(p => p.uploading);
    if (stillUploading) { setError('Fotoğraflar yüklenmeye devam ediyor, lütfen bekleyin.'); return; }

    const uploadedUrls = photos.filter(p => p.uploadedUrl).map(p => p.uploadedUrl!);

    if (assignment.task.requires_photo && uploadedUrls.length === 0) {
      setError('Bu görev için fotoğraf zorunludur.');
      return;
    }
    if (photos.some(p => p.error)) {
      setError('Bazı fotoğraflar yüklenemedi. Onları kaldırıp tekrar deneyin.');
      return;
    }

    setError(''); setSubmitting(true);
    try {
      await onSubmit(assignment.id, uploadedUrls, note);
    } catch {
      setError('Gönderi başarısız. Tekrar deneyin.');
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Task info */}
      <div className={`rounded-lg border ${CATEGORY_BORDER[cat]} pl-4 pr-3 py-3 bg-gray-50 flex flex-col gap-1`}>
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${CATEGORY_BADGE[cat]}`}>{CATEGORY_LABEL[cat]}</span>
          {assignment.zone && <span className="text-xs text-gray-500">{assignment.zone.name}</span>}
        </div>
        <p className="font-semibold text-sm text-gray-800 flex items-center gap-2 flex-wrap">
          {assignment.task.title}
          {assignment.times_per_day > 1 && (
            <span className="text-[11px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
              {assignment.occurrence}/{assignment.times_per_day}. kontrol
            </span>
          )}
        </p>
        {assignment.task.description && <p className="text-xs text-gray-500">{assignment.task.description}</p>}
      </div>

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((ph, i) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
              <img src={ph.previewUrl} alt="" className="w-full h-full object-cover" />

              {/* Upload overlay */}
              {ph.uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {ph.error && (
                <div className="absolute inset-0 bg-red-900/60 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">Hata</span>
                </div>
              )}
              {!ph.uploading && !ph.error && (
                <div className="absolute top-1 right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <span className="text-white text-[10px]">✓</span>
                </div>
              )}

              <button
                onClick={() => removePhoto(i)}
                className="absolute top-1 left-1 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100"
              >×</button>
            </div>
          ))}
        </div>
      )}

      {/* Camera button */}
      <div>
        <input ref={inputRef} type="file" accept="image/*" capture="environment" multiple onChange={handleFiles} className="hidden" />
        <button onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50 rounded-xl py-4 text-sm text-gray-500 hover:text-indigo-600 transition-all flex flex-col items-center gap-1">
          <span className="text-2xl">📷</span>
          <span>
            {photos.length === 0
              ? (assignment.task.requires_photo ? 'Fotoğraf Çek (zorunlu)' : 'Fotoğraf Çek (isteğe bağlı)')
              : '+ Daha Fazla Fotoğraf'}
          </span>
        </button>
      </div>

      {/* Note */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">Not (isteğe bağlı)</label>
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400" />
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 p-2 rounded">{error}</p>}

      {photos.some(p => p.uploading) && (
        <p className="text-xs text-indigo-600 text-center">Fotoğraflar yükleniyor...</p>
      )}

      <div className="flex gap-2">
        <Button variant="secondary" onClick={onClose} className="flex-1">İptal</Button>
        <Button
          onClick={handleSubmit}
          isLoading={submitting}
          className="flex-1"
          disabled={photos.some(p => p.uploading)}
        >
          Gönder {photos.filter(p => p.uploadedUrl).length > 0 && `(${photos.filter(p => p.uploadedUrl).length} fotoğraf)`}
        </Button>
      </div>
    </div>
  );
}
