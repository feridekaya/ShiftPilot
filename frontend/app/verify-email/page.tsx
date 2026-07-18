'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/services/api';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') ?? '';

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) { setStatus('error'); setMessage('Geçersiz bağlantı.'); return; }
    api
      .post('/api/auth/verify-email/', { token })
      .then(() => { setStatus('success'); setTimeout(() => router.push('/login'), 3000); })
      .catch((err: unknown) => {
        const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
        setStatus('error');
        setMessage(msg ?? 'Doğrulama başarısız. Bağlantı geçersiz veya süresi dolmuş olabilir.');
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="min-h-screen flex">
      <div className="hidden md:flex w-1/2 bg-[#0e2549] items-center justify-center p-12">
        <Image src="/logos/logo-dark.png" alt="ShiftPilot" width={220} height={110} className="object-contain" priority />
      </div>

      <div className="flex flex-1 items-center justify-center bg-white dark:bg-[#0A1128] p-6">
        <div className="w-full max-w-sm text-center">
          <div className="md:hidden flex justify-center mb-8">
            <Image src="/logos/logo-light.png" alt="ShiftPilot" width={160} height={80} className="object-contain dark:hidden" />
            <Image src="/logos/logo-dark.png" alt="ShiftPilot" width={160} height={80} className="object-contain hidden dark:block" />
          </div>

          {status === 'loading' && (
            <>
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <svg className="w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">E-posta doğrulanıyor…</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Lütfen bekleyin.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">E-posta doğrulandı!</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                Hesabınız aktifleştirildi. Giriş sayfasına yönlendiriliyorsunuz…
              </p>
              <Link href="/login" className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline">Hemen giriş yap</Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Doğrulama başarısız</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{message}</p>
              <Link href="/login" className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline">Giriş sayfasına dön</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return <Suspense><VerifyEmailContent /></Suspense>;
}
