'use client';

import { useEffect, useState } from 'react';
import { TaskSubmission } from '@/types';
import * as submissionService from '@/services/submissions';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

export default function SupervisorPage() {
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteMap, setNoteMap] = useState<Record<number, string>>({});
  const [processing, setProcessing] = useState<number | null>(null);

  useEffect(() => {
    submissionService.getSubmissions({ status: 'pending' })
      .then(setSubmissions)
      .finally(() => setLoading(false));
  }, []);

  async function handleApprove(id: number) {
    setProcessing(id);
    await submissionService.approveSubmission(id, noteMap[id]);
    setSubmissions(prev => prev.filter(s => s.id !== id));
    setProcessing(null);
  }

  async function handleReject(id: number) {
    if (!noteMap[id]?.trim()) {
      alert('Red sebebi belirtiniz.');
      return;
    }
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
        <div className="text-center text-gray-400 mt-20">Onay bekleyen gönderi yok.</div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {submissions.map(s => (
          <div key={s.id} className="bg-white rounded-lg shadow p-4 flex flex-col gap-3">
            {/* Görev + Personel bilgisi */}
            <div className="border-b pb-2">
              <p className="font-semibold text-gray-800">{s.assignment.task_title}</p>
              <p className="text-sm text-gray-500">{s.assignment.user.name}</p>
              <div className="flex gap-3 text-xs text-gray-400 mt-1">
                {s.assignment.zone_name && <span>📍 {s.assignment.zone_name}</span>}
                {s.assignment.shift_name && <span>⏰ {s.assignment.shift_name}</span>}
                <span>{s.assignment.date}</span>
              </div>
            </div>

            {/* Fotoğraf */}
            {s.photo_url && (
              <img src={s.photo_url} alt="Görev fotoğrafı" className="w-full h-48 object-cover rounded" />
            )}
            <p className="text-xs text-gray-400">
              Gönderildi: {new Date(s.submitted_at).toLocaleString('tr-TR')}
            </p>

            {/* Not */}
            <textarea
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm resize-none"
              rows={2}
              placeholder="Not (red için zorunlu)..."
              value={noteMap[s.id] ?? ''}
              onChange={e => setNoteMap(prev => ({ ...prev, [s.id]: e.target.value }))}
            />
            <div className="flex gap-2">
              <Button
                variant="primary"
                size="sm"
                className="flex-1 justify-center"
                isLoading={processing === s.id}
                onClick={() => handleApprove(s.id)}
              >
                Onayla
              </Button>
              <Button
                variant="danger"
                size="sm"
                className="flex-1 justify-center"
                isLoading={processing === s.id}
                onClick={() => handleReject(s.id)}
              >
                Reddet
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
