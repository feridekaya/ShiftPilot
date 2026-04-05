'use client';

import { useEffect, useState } from 'react';
import { Assignment } from '@/types';
import * as assignmentService from '@/services/assignments';
import * as submissionService from '@/services/submissions';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import CameraCapture from '@/components/CameraCapture';
import Spinner from '@/components/ui/Spinner';

export default function EmployeePage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
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

  async function handleCapture(dataUrl: string) {
    if (!selectedId) return;
    setCameraOpen(false);
    setSubmitting(true);
    try {
      await submissionService.createSubmission(selectedId, dataUrl);
      setAssignments(prev =>
        prev.map(a => a.id === selectedId ? { ...a, status: 'completed' } : a)
      );
    } catch {
      alert('Gönderi başarısız. Tekrar deneyin.');
    } finally {
      setSubmitting(false);
      setSelectedId(null);
    }
  }

  if (loading) return <div className="flex justify-center mt-20"><Spinner size="lg" /></div>;

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Bugünkü Görevlerim — {businessDate}</h1>

      {assignments.length === 0 && (
        <div className="text-center text-gray-400 mt-20">Bugün için atanmış görev yok.</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {assignments.map(a => {
          // En son gönderim — red notu için
          const lastSub = a.submissions?.[a.submissions.length - 1];
          const wasRejected = lastSub?.approval_status === 'rejected';

          return (
            <div key={a.id} className="bg-white rounded-lg shadow p-4 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <h2 className="font-semibold">{a.task.title}</h2>
                <Badge status={a.status} />
              </div>
              <div className="text-sm text-gray-500 space-y-1">
                <p>Bölge: {a.zone?.name ?? '-'}</p>
                <p>Vardiya: {a.shift?.name ?? '-'}</p>
                {a.task.coefficient > 1 && <p>Katsayı: {a.task.coefficient}</p>}
              </div>

              {/* Red notu */}
              {wasRejected && lastSub.note && (
                <div className="rounded bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                  <span className="font-semibold">Red sebebi: </span>{lastSub.note}
                </div>
              )}

              {/* Gönderim geçmişi özeti */}
              {a.submissions && a.submissions.length > 0 && (
                <p className="text-xs text-gray-400">
                  {a.submissions.length} gönderim denemesi
                </p>
              )}

              {/* Aksiyon butonları */}
              {a.status === 'pending' && a.task.requires_photo && (
                <Button
                  size="sm"
                  isLoading={submitting && selectedId === a.id}
                  onClick={() => { setSelectedId(a.id); setCameraOpen(true); }}
                >
                  {wasRejected ? 'Yeniden Gönder' : 'Fotoğrafla Tamamla'}
                </Button>
              )}
              {a.status === 'pending' && !a.task.requires_photo && (
                <Button size="sm" variant="secondary" disabled>
                  Fotoğraf Gerektirmiyor
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <Modal isOpen={cameraOpen} onClose={() => { setCameraOpen(false); setSelectedId(null); }} title="Görev Fotoğrafı">
        <CameraCapture
          onCapture={handleCapture}
          onCancel={() => { setCameraOpen(false); setSelectedId(null); }}
        />
      </Modal>
    </div>
  );
}
