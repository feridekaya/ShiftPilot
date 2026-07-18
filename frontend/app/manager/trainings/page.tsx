'use client';

import { useEffect, useRef, useState } from 'react';
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

const ROLE_LABELS: Record<string, string> = {
  employee: 'Personeller',
  supervisor: 'Şefler',
};

function RoleBadges({ roles }: { roles: string[] }) {
  if (!roles || roles.length === 0) {
    return <span className="text-xs text-gray-400">Tümü</span>;
  }
  return (
    <div className="flex gap-1 flex-wrap">
      {roles.map(r => (
        <span key={r} className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
          r === 'supervisor' ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
        }`}>
          {ROLE_LABELS[r] ?? r}
        </span>
      ))}
    </div>
  );
}

export default function ManagerTrainingsPage() {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    pdf_url: '',
    pdf_name: '',
    visible_to: [] as string[],
  });

  useEffect(() => { load(); }, []);

  async function load() {
    try { setTrainings(await svc.getTrainings()); }
    finally { setLoading(false); }
  }

  function openCreate() {
    setForm({ title: '', description: '', pdf_url: '', pdf_name: '', visible_to: [] });
    setUploadProgress('');
    setShowForm(true);
  }

  function toggleRole(role: string) {
    setForm(f => ({
      ...f,
      visible_to: f.visible_to.includes(role)
        ? f.visible_to.filter(r => r !== role)
        : [...f.visible_to, role],
    }));
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert('Yalnızca PDF dosyası yükleyebilirsiniz.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      alert('Dosya boyutu 20MB sınırını aşıyor.');
      return;
    }
    setUploading(true);
    setUploadProgress('Yükleniyor...');
    try {
      const url = await svc.uploadPdf(file);
      setForm(f => ({ ...f, pdf_url: url, pdf_name: file.name }));
      setUploadProgress('Yüklendi');
    } catch {
      setUploadProgress('Yükleme başarısız');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.pdf_url) { alert('Lütfen bir PDF yükleyin.'); return; }
    if (form.visible_to.length === 0) { alert('En az bir hedef kitle seçin.'); return; }
    setSaving(true);
    try {
      const created = await svc.createTraining({
        title: form.title,
        description: form.description,
        pdf_url: form.pdf_url,
        visible_to: form.visible_to,
      });
      setTrainings(prev => [created, ...prev]);
      setShowForm(false);
    } finally { setSaving(false); }
  }

  async function handleDelete(t: Training) {
    if (!confirm(`"${t.title}" silinsin mi?`)) return;
    await svc.deleteTraining(t.id);
    setTrainings(prev => prev.filter(x => x.id !== t.id));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#0A1128] px-4 py-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Eğitimler</h1>
          <p className="text-sm text-gray-400 dark:text-slate-500 mt-0.5">{trainings.length} eğitim materyali</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
          Yeni Eğitim
        </button>
      </div>

      {/* Empty state */}
      {trainings.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <PdfIcon className="w-20 h-20 text-gray-200 mb-4" />
          <p className="text-lg font-semibold text-gray-400 mb-2">Henüz eğitim materyali yüklenmedi.</p>
          <p className="text-sm text-gray-400 mb-6">PDF yükleyerek ekibinizle paylaşabilirsiniz.</p>
          <button onClick={openCreate} className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">
            + Yeni Eğitim
          </button>
        </div>
      )}

      {/* List */}
      <div className="flex flex-col gap-4">
        {trainings.map(t => (
          <div key={t.id} className="bg-white dark:bg-[#111E38] rounded-xl shadow-sm border border-gray-100 dark:border-[#1E293B] p-5 flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-red-50 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
              <PdfIcon className="w-6 h-6 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-slate-100 text-base leading-snug">{t.title}</h3>
              {t.description && (
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-2">{t.description}</p>
              )}
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <RoleBadges roles={t.visible_to} />
                <span className="text-xs text-gray-400 dark:text-slate-500">
                  {new Date(t.created_at).toLocaleDateString('tr-TR', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <a
                href={t.pdf_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-[#162543] text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-[#192d4a] font-medium transition-colors"
              >
                Aç
              </a>
              <button
                onClick={() => handleDelete(t)}
                className="text-xs px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 font-medium transition-colors"
              >
                Sil
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="bg-white dark:bg-[#111E38] rounded-2xl shadow-2xl w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-[#1E293B]">
              <h2 className="font-bold text-gray-900 dark:text-slate-100">Yeni Eğitim</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Başlık</label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  required
                  className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-[#1E293B] bg-white dark:bg-[#162543] text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="Eğitim başlığı..."
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Açıklama <span className="text-gray-400 font-normal">(isteğe bağlı)</span></label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-[#1E293B] bg-white dark:bg-[#162543] text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                  placeholder="Kısa açıklama..."
                />
              </div>

              {/* PDF Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">PDF Dosyası</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div
                  onClick={() => !uploading && fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
                    form.pdf_url ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30'
                  } ${uploading ? 'opacity-60 cursor-wait' : ''}`}
                >
                  {form.pdf_url ? (
                    <div className="flex items-center justify-center gap-2 text-emerald-700">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                      <span className="text-sm font-medium">{form.pdf_name}</span>
                    </div>
                  ) : (
                    <div>
                      <PdfIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        {uploading ? uploadProgress : 'PDF seçmek için tıklayın'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">Maks. 20 MB</p>
                    </div>
                  )}
                </div>
                {uploadProgress === 'Yükleme başarısız' && (
                  <p className="text-xs text-red-500 mt-1">Yükleme başarısız, tekrar deneyin.</p>
                )}
              </div>

              {/* Visible to */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Kimler Görebilsin?</label>
                <div className="flex gap-3">
                  {['employee', 'supervisor'].map(role => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => toggleRole(role)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                        form.visible_to.includes(role)
                          ? role === 'supervisor'
                            ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                            : 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'border-gray-200 dark:border-[#1E293B] bg-white dark:bg-[#162543] text-gray-500 dark:text-slate-400 hover:border-gray-300 dark:hover:border-slate-500'
                      }`}
                    >
                      {ROLE_LABELS[role]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-[#162543] rounded-xl hover:bg-gray-200 dark:hover:bg-[#192d4a] transition-colors">
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60"
                >
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
