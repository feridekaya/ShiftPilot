'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AxiosError } from 'axios';
import { register } from '@/services/auth';

const emptyForm = {
  business_name: '',
  name: '',
  email: '',
  password: '',
  password_confirm: '',
  gender: '' as '' | 'male' | 'female',
};

export default function RegisterPage() {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (form.password !== form.password_confirm) {
      setError('Şifreler eşleşmiyor.');
      return;
    }
    if (form.password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.');
      return;
    }

    setSubmitting(true);
    try {
      await register({
        business_name: form.business_name,
        name: form.name,
        email: form.email,
        password: form.password,
        gender: form.gender || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      const axiosErr = err as AxiosError<Record<string, string | string[]>>;
      const data = axiosErr.response?.data;
      const raw = data ? Object.values(data).flat().join(' ') : '';
      setError(raw || 'Kayıt oluşturulamadı. Lütfen tekrar deneyin.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">

      {/* Sol panel — logo ve slogan */}
      <div className="hidden lg:flex flex-col items-center justify-center w-1/2 px-16 py-14 gap-10">
        <Image
          src="/logos/logo-dark.png"
          alt="ShiftPilot"
          width={360}
          height={140}
          className="w-72 h-auto object-contain"
          priority
        />

        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-white leading-snug mb-4">
            İşletmenizi<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-300">
              Dakikalar İçinde Kurun
            </span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-xs mx-auto">
            İşletmenizi kaydedin, ekibinizi ekleyin ve görev yönetimine hemen başlayın.
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          {[
            { icon: '🏢', text: 'Kendi işletmenize özel, izole çalışma alanı' },
            { icon: '👥', text: 'Yönetici, şef ve personel rolleri' },
            { icon: '🔒', text: 'Verileriniz diğer işletmelerden tamamen ayrı' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-2.5 border border-white/10">
              <span className="text-base">{item.icon}</span>
              <span className="text-slate-300 text-sm">{item.text}</span>
            </div>
          ))}
        </div>

        <p className="text-slate-600 text-xs mt-auto">© 2026 ShiftPilot. Tüm hakları saklıdır.</p>
      </div>

      {/* Sağ panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">

          <div className="mb-10 lg:hidden flex justify-center">
            <Image
              src="/logos/logo-dark.png"
              alt="ShiftPilot"
              width={220}
              height={80}
              className="w-44 h-auto object-contain"
              priority
            />
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            {submitted ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
                  <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Hesabınız oluşturuldu</h2>
                <p className="text-slate-400 text-sm mb-6">
                  <strong className="text-slate-300">{form.email}</strong> adresine bir doğrulama bağlantısı gönderdik.
                  Giriş yapabilmek için lütfen e-postanızı doğrulayın.
                </p>
                <Link href="/login" className="text-violet-400 hover:text-violet-300 text-sm font-medium transition-colors">
                  Giriş sayfasına dön
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-1.5">İşletmenizi kaydedin</h2>
                  <p className="text-slate-400 text-sm">30 saniyede ücretsiz hesap oluşturun</p>
                </div>

                {error && (
                  <div className="mb-5 flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                    <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                    </svg>
                    <span className="text-red-400 text-sm">{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">İşletme Adı</label>
                    <input
                      type="text"
                      value={form.business_name}
                      onChange={e => setForm({ ...form, business_name: e.target.value })}
                      required
                      placeholder="Örn. Deniz Restoran"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Ad Soyad</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      required
                      placeholder="Adınız Soyadınız"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">E-posta</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      required
                      autoComplete="email"
                      placeholder="ornek@sirket.com"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Şifre</label>
                      <input
                        type="password"
                        value={form.password}
                        onChange={e => setForm({ ...form, password: e.target.value })}
                        required
                        autoComplete="new-password"
                        placeholder="••••••••"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Şifre (Tekrar)</label>
                      <input
                        type="password"
                        value={form.password_confirm}
                        onChange={e => setForm({ ...form, password_confirm: e.target.value })}
                        required
                        autoComplete="new-password"
                        placeholder="••••••••"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg shadow-violet-900/30 mt-1 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        Hesap oluşturuluyor...
                      </>
                    ) : (
                      'Hesap Oluştur'
                    )}
                  </button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-400">
                  Zaten hesabınız var mı?{' '}
                  <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
                    Giriş yapın
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
