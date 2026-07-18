'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/services/api';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) setError('Geçersiz bağlantı. Lütfen şifremi unuttum sayfasından yeniden talep edin.');
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Şifre en az 6 karakter olmalıdır.'); return; }
    if (password !== confirm) { setError('Şifreler eşleşmiyor.'); return; }
    setLoading(true);
    try {
      await api.post('/api/auth/password-reset-confirm/', { token, password });
      setDone(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg ?? 'Bir hata oluştu. Bağlantı geçersiz veya süresi dolmuş olabilir.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden md:flex w-1/2 bg-[#0e2549] items-center justify-center p-12">
        <div className="flex flex-col items-center gap-8 text-white text-center">
          <Image src="/logos/logo-dark.png" alt="ShiftPilot" width={220} height={110} className="object-contain" priority />
          <p className="text-slate-300 text-lg leading-relaxed max-w-xs">Yeni şifrenizi belirleyin.</p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-white dark:bg-[#0A1128] p-6">
        <div className="w-full max-w-sm">
          <div className="md:hidden flex justify-center mb-8">
            <Image src="/logos/logo-light.png" alt="ShiftPilot" width={160} height={80} className="object-contain dark:hidden" />
            <Image src="/logos/logo-dark.png" alt="ShiftPilot" width={160} height={80} className="object-contain hidden dark:block" />
          </div>

          {done ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Şifre güncellendi!</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Şifreniz başarıyla değiştirildi. Giriş sayfasına yönlendiriliyorsunuz…</p>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Yeni Şifre Belirle</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">En az 6 karakterden oluşan yeni şifrenizi girin.</p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Yeni Şifre</label>
                  <input
                    type="password" value={password} onChange={e => setPassword(e.target.value)}
                    required minLength={6} autoFocus placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-[#1E293B] bg-white dark:bg-[#111E38] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Şifre Tekrar</label>
                  <input
                    type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                    required placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-[#1E293B] bg-white dark:bg-[#111E38] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>

                {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}

                <button
                  type="submit" disabled={loading || !token}
                  className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold text-sm transition-colors"
                >
                  {loading ? 'Kaydediliyor…' : 'Şifremi Güncelle'}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                <Link href="/login" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">Giriş sayfasına dön</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return <Suspense><ResetPasswordForm /></Suspense>;
}
