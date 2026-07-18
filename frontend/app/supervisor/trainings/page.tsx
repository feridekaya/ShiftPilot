'use client';

import { useEffect, useState } from 'react';
import { Training } from '@/types';
import * as svc from '@/services/trainingsService';

function PdfIcon({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

export default function SupervisorTrainingsPage() {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    svc.getTrainings()
      .then(setTrainings)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#0A1128] px-4 py-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Eğitimler</h1>
        <p className="text-sm text-gray-400 dark:text-slate-500 mt-0.5">Sizinle paylaşılan eğitim materyalleri</p>
      </div>

      {trainings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <PdfIcon className="w-20 h-20 text-gray-200 dark:text-slate-700 mb-4" />
          <p className="text-lg font-semibold text-gray-400 dark:text-slate-500 mb-1">Henüz paylaşılan eğitim yok.</p>
          <p className="text-sm text-gray-400 dark:text-slate-500">Yöneticiniz bir eğitim paylaştığında burada görünecek.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {trainings.map(t => (
            <div key={t.id} className="bg-white dark:bg-[#111E38] rounded-xl shadow-sm border border-gray-100 dark:border-[#1E293B] p-5 flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-red-50 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                <PdfIcon className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-slate-100 text-base leading-snug">{t.title}</h3>
                {t.description && (
                  <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{t.description}</p>
                )}
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1.5">
                  {new Date(t.created_at).toLocaleDateString('tr-TR', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </p>
              </div>
              <a
                href={t.pdf_url}
                target="_blank"
                rel="noreferrer"
                className="flex-shrink-0 inline-flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
                </svg>
                İndir / Aç
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
