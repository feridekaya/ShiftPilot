'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/services/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/api/auth/password-reset/', { email });
      setSubmitted(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg ?? 'Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden md:flex w-1/2 bg-[#0e2549] items-center justify-center p-12">
        <div className="flex flex-col items-center gap-8 text-white text-center">
          <Image
            src="/logos/logo-dark.png"
            alt="ShiftPilot"
            width={220}
            height={110}
            className="object-contain"
            priority
          />
          <p className="text-slate-300 text-lg leading-relaxed max-w-xs">
            Şifrenizi sıfırlamak için e-posta adresinizi girin.
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-white dark:bg-[#0A1128] p-6">
        <div className="w-full max-w-sm">
          <div className="md:hidden flex justify-center mb-8">
            <Image src="/logos/logo-light.png" alt="ShiftPilot" width={160} height={80} className="object-contain dark:hidden" />
            <Image src="/logos/logo-dark.png" alt="ShiftPilot" width={160} height={80} className="object-contain hidden dark:block" />
          </div>

          {submitted ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">E-posta gönderildi</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                Şifre sıfırlama bağlantısı <strong>{email}</strong> adresine gönderildi. Gelen kutunuzu kontrol edin.
              </p>
              <Link href="/login" className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline">
                Giriş sayfasına dön
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Şifremi Unuttum</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
                E-posta adresinizi girin, size sıfırlama bağlantısı gönderelim.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-posta</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoFocus
                    placeholder="ornek@email.com"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-[#1E293B] bg-white dark:bg-[#111E38] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>

                {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold text-sm transition-colors"
                >
                  {loading ? 'Gönderiliyor…' : 'Sıfırlama Bağlantısı Gönder'}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                <Link href="/login" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
                  Giriş sayfasına dön
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
