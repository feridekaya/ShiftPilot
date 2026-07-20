'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

function CheckIcon() {
  return (
    <svg className="w-5 h-5 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function AppMockup() {
  return (
    <div className="relative w-full max-w-lg mx-auto">
      <div className="absolute -left-10 top-8 z-10 bg-[#0e2549] rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3 border border-[#1a3a6b]">
        <div className="w-9 h-9 rounded-xl bg-emerald-900/60 flex items-center justify-center">
          <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <div>
          <div className="text-[11px] text-slate-400 font-medium">Eksik Görev</div>
          <div className="text-sm font-bold text-white">Sıfır</div>
        </div>
      </div>

      <div className="absolute -right-8 top-16 z-10 bg-[#0e2549] rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3 border border-[#1a3a6b]">
        <div className="w-9 h-9 rounded-xl bg-violet-900/60 flex items-center justify-center">
          <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <div>
          <div className="text-[11px] text-slate-400 font-medium">Görev Onayı</div>
          <div className="text-sm font-bold text-white">Anlık bildirim</div>
        </div>
      </div>

      <div className="absolute -left-8 bottom-12 z-10 bg-[#0e2549] rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3 border border-[#1a3a6b]">
        <div className="w-9 h-9 rounded-xl bg-orange-900/60 flex items-center justify-center">
          <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <div>
          <div className="text-[11px] text-slate-400 font-medium">Denetim</div>
          <div className="text-sm font-bold text-white">7/24 canlı takip</div>
        </div>
      </div>

      <div className="relative bg-[#071a35] rounded-3xl shadow-2xl border border-[#1a3a6b] overflow-hidden">
        <div className="bg-[#051228] px-4 py-3 flex items-center gap-2 border-b border-[#1a3a6b]">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
          <div className="flex-1 mx-4">
            <div className="bg-[#0e2549] rounded-lg px-3 py-1 text-[11px] text-slate-400 text-center border border-[#1a3a6b]">appshiftpilot.com</div>
          </div>
        </div>
        <div className="p-4 min-h-[340px]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <span className="text-xs font-semibold text-slate-300">Bugün — Pzt 11 Nis</span>
            </div>
            <div className="flex gap-1.5">
              <div className="text-[10px] bg-indigo-600 text-white px-2.5 py-1 rounded-lg font-medium">Atamalar</div>
              <div className="text-[10px] bg-[#0e2549] text-slate-400 px-2.5 py-1 rounded-lg font-medium border border-[#1a3a6b]">Çizelge</div>
              <div className="text-[10px] bg-[#0e2549] text-slate-400 px-2.5 py-1 rounded-lg font-medium border border-[#1a3a6b]">Denetim</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {[
              { name: 'Ayşe K.', task: 'Masa Temizliği', zone: 'Ön Salon', shift: 'Sabah', status: 'approved' },
              { name: 'Mehmet D.', task: 'Stok Sayımı', zone: 'Depo', shift: 'Akşam', status: 'pending' },
              { name: 'Fatma S.', task: 'Müşteri Karşılama', zone: 'Giriş', shift: 'Sabah', status: 'completed' },
              { name: 'Ali R.', task: 'Ekipman Kontrolü', zone: 'Mutfak', shift: 'Akşam', status: 'pending' },
            ].map((item, i) => (
              <div key={i} className="bg-[#0e2549] rounded-xl border border-[#1a3a6b] p-2.5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-slate-200">{item.name}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${item.status === 'approved' ? 'bg-emerald-900/60 text-emerald-400' : item.status === 'completed' ? 'bg-blue-900/60 text-blue-400' : 'bg-yellow-900/60 text-yellow-400'}`}>
                    {item.status === 'approved' ? 'Onaylandı' : item.status === 'completed' ? 'Tamamlandı' : 'Bekliyor'}
                  </span>
                </div>
                <div className="text-[10px] font-medium text-slate-300 mb-1">{item.task}</div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-slate-500">📍{item.zone}</span>
                  <span className="text-[9px] text-slate-500">⏱{item.shift}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            {[
              { label: 'Toplam Görev', value: '12', bg: 'bg-indigo-900/40', text: 'text-indigo-300' },
              { label: 'Tamamlanan',   value: '8',  bg: 'bg-emerald-900/40', text: 'text-emerald-300' },
              { label: 'Bekleyen',     value: '4',  bg: 'bg-orange-900/40',  text: 'text-orange-300' },
            ].map((s, i) => (
              <div key={i} className={`flex-1 ${s.bg} rounded-xl px-3 py-2 text-center border border-white/5`}>
                <div className={`text-base font-bold ${s.text}`}>{s.value}</div>
                <div className="text-[9px] text-slate-500 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [featureTab, setFeatureTab]         = useState(0);
  const [roleTab, setRoleTab]               = useState(0);

  return (
    <div className="min-h-screen bg-[#071a35] text-white" style={{ scrollBehavior: 'smooth' }}>

      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-[#071a35]/95 backdrop-blur-md border-b border-[#1a3a6b]">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between py-2">
          <Image src="/logos/logo-dark.png" alt="ShiftPilot" width={180} height={60} className="h-14 w-auto object-contain" priority />

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-400">
            <a href="#problems" className="hover:text-white transition-colors">Çözümler</a>
            <a href="#features" className="hover:text-white transition-colors">Özellikler</a>
            <a href="#roles"    className="hover:text-white transition-colors">Roller</a>
            <a href="#faq"      className="hover:text-white transition-colors">SSS</a>
            <a href="#pricing"  className="hover:text-white transition-colors">İletişim</a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm font-semibold text-white px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/40">
              Giriş Yap
            </Link>
          </div>

          <button className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d={mobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#1a3a6b] bg-[#071a35] px-6 py-4 flex flex-col gap-4 text-sm font-medium text-slate-400">
            <a href="#problems" onClick={() => setMobileMenuOpen(false)}>Çözümler</a>
            <a href="#features" onClick={() => setMobileMenuOpen(false)}>Özellikler</a>
            <a href="#roles"    onClick={() => setMobileMenuOpen(false)}>Roller</a>
            <a href="#faq"      onClick={() => setMobileMenuOpen(false)}>SSS</a>
            <a href="#pricing"  onClick={() => setMobileMenuOpen(false)}>İletişim</a>
            <Link href="/login" className="text-center text-white font-semibold px-5 py-2.5 rounded-xl bg-indigo-600 shadow-lg">Giriş Yap</Link>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div>
          <div className="inline-flex items-center gap-2 bg-indigo-950 border border-indigo-800/60 text-indigo-300 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Vardiya ve operasyonu dijitalleştirin
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-[1.1] tracking-tight mb-6">
            Vardiyayı Yöneten{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Akıllı Operasyon
            </span>{' '}
            Sistemi
          </h1>

          <p className="text-lg text-slate-400 leading-relaxed mb-10 max-w-lg">
            ShiftPilot; vardiya çizelgesi, görev atama ve performans takibini tek ekranda toplar.
            Kaosu bitirir — personelin verimliliğini ve dükkanın huzurunu herkes görür.
          </p>

          <div className="flex items-center gap-2 mb-6">
            {[
              { icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="2" y="3" width="20" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round"/><path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8M12 17v4"/></svg>, label: 'Masaüstü' },
              { icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="5" y="2" width="14" height="20" rx="2" strokeLinecap="round" strokeLinejoin="round"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01"/></svg>, label: 'Mobil' },
              { icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="2" y="4" width="20" height="16" rx="2" strokeLinecap="round" strokeLinejoin="round"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01"/></svg>, label: 'Tablet' },
            ].map((d, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-[#0e2549] border border-[#1a3a6b] text-slate-400 text-xs font-semibold px-3 py-1.5 rounded-full">
                {d.icon}
                {d.label}
              </div>
            ))}
          </div>

          <ul className="flex flex-col gap-3 text-sm text-slate-400">
            {[
              'Fotoğraflı görev tamamlama — galeri yasağı, sadece kamera',
              'Unutulan veya eksik yapılan görevleri hemen tespit edin',
              'Denetim kaydı ve performans raporları',
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-2.5">
                <CheckIcon />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="hidden lg:block">
          <AppMockup />
        </div>
      </section>

      {/* STATS CARDS */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            { icon: <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>, label: 'VERİMLİLİK', value: 'Artış sağlar', desc: 'Görev dağılımı optimize edilince personel verimliliği yükseliyor.', border: 'border-indigo-800/40', bg: 'bg-indigo-950/50' },
            { icon: <svg className="w-6 h-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>, label: 'HATA ORANI', value: 'Sıfır atlanmış görev', desc: 'Unutulan veya eksik yapılan görevleri hemen tespit edersiniz.', border: 'border-violet-800/40', bg: 'bg-violet-950/50' },
            { icon: <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>, label: 'DENETİM', value: '7/24 canlı takip', desc: 'Denetim kaydı ve fotoğraflı kanıt her zaman elinizin altında.', border: 'border-emerald-800/40', bg: 'bg-emerald-950/50' },
          ].map((card, i) => (
            <div key={i} className={`${card.bg} border ${card.border} rounded-2xl p-6`}>
              <div className="mb-3">{card.icon}</div>
              <div className="text-[10px] font-bold tracking-widest text-slate-500 mb-1">{card.label}</div>
              <div className="text-xl font-extrabold text-white mb-2">{card.value}</div>
              <p className="text-sm text-slate-400 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CROSS-DEVICE */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="bg-gradient-to-br from-[#0d2244] via-[#0e2549] to-[#071a35] border border-[#1a3a6b] rounded-3xl overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0 items-center">

            {/* Sol — metin */}
            <div className="p-10 md:p-14">
              <div className="inline-flex items-center gap-2 bg-[#071a35] border border-[#1a3a6b] text-indigo-400 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-6">
                Masaüstü &amp; Mobil
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 leading-tight">
                Masaüstünde de,<br className="hidden sm:block" /> cebinizde de çalışır
              </h2>
              <p className="text-slate-400 leading-relaxed mb-8 text-base">
                ShiftPilot kurulum gerektirmez — tarayıcı üzerinden her cihazda açılır.
                Yönetici geniş ekranda planlar, personel telefondan tamamlar.
              </p>
              <div className="space-y-5">
                {[
                  {
                    icon: (
                      <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <rect x="2" y="3" width="20" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8M12 17v4" />
                      </svg>
                    ),
                    label: 'Masaüstü / Dizüstü',
                    desc: 'Yönetici ve şef paneli için tam ekran deneyimi — çizelge, atama ve raporlar büyük ekranda.',
                  },
                  {
                    icon: (
                      <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <rect x="5" y="2" width="14" height="20" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01" />
                      </svg>
                    ),
                    label: 'Akıllı Telefon',
                    desc: 'Personel görevlerini telefondan görür, kamera ile fotoğraf çekip anında teslim eder.',
                  },
                  {
                    icon: (
                      <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <rect x="2" y="4" width="20" height="16" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01" />
                      </svg>
                    ),
                    label: 'Tablet',
                    desc: 'Mutfak tezgahına ya da kasaya sabitlenmiş tablet ekranlar için de mükemmel uyum.',
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {item.icon}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white mb-0.5">{item.label}</div>
                      <div className="text-sm text-slate-400 leading-relaxed">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sağ — cihaz görseli */}
            <div className="hidden md:flex items-center justify-center p-10 relative min-h-[400px]">
              {/* Laptop */}
              <div className="relative z-10">
                {/* Screen */}
                <div className="w-72 bg-[#051228] rounded-t-xl border border-[#1a3a6b] overflow-hidden">
                  {/* Tarayıcı bar */}
                  <div className="bg-[#071a35] px-3 py-2 flex items-center gap-1.5 border-b border-[#1a3a6b]">
                    <div className="w-2 h-2 rounded-full bg-red-500/50" />
                    <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                    <div className="w-2 h-2 rounded-full bg-emerald-500/50" />
                    <div className="flex-1 mx-2 bg-[#0e2549] rounded text-[9px] text-slate-500 text-center py-0.5 border border-[#1a3a6b]">
                      appshiftpilot.com
                    </div>
                  </div>
                  {/* App içeriği */}
                  <div className="p-3 bg-[#0A1128]">
                    {/* Sidebar + main */}
                    <div className="flex gap-2">
                      <div className="w-14 flex flex-col gap-1.5">
                        <div className="h-6 bg-[#0e2549] rounded-lg border border-[#1a3a6b]" />
                        {['bg-indigo-600','bg-[#0e2549]','bg-[#0e2549]','bg-[#0e2549]'].map((bg, i) => (
                          <div key={i} className={`h-4 ${bg} rounded border border-[#1a3a6b]`} />
                        ))}
                      </div>
                      <div className="flex-1 flex flex-col gap-1.5">
                        <div className="h-4 bg-[#0e2549] rounded border border-[#1a3a6b]" />
                        <div className="grid grid-cols-2 gap-1.5">
                          {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-12 bg-[#0e2549] rounded-lg border border-[#1a3a6b] p-1.5">
                              <div className="h-1.5 bg-indigo-600/60 rounded mb-1 w-3/4" />
                              <div className="h-1.5 bg-slate-600/50 rounded w-1/2" />
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-1.5">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex-1 h-8 bg-[#0e2549] rounded-lg border border-[#1a3a6b] p-1.5">
                              <div className={`h-2.5 rounded text-center text-[7px] flex items-center justify-center font-bold ${i===0?'bg-emerald-900/60 text-emerald-400':i===1?'bg-yellow-900/60 text-yellow-400':'bg-indigo-900/60 text-indigo-400'}`}>
                                {['✓ 8','⏳ 4','∑ 12'][i]}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Laptop alt kısmı */}
                <div className="w-80 h-3 bg-[#0a1a35] rounded-b-xl -ml-4 border border-t-0 border-[#1a3a6b]" />
              </div>

              {/* Telefon — sağ altta örtüşen */}
              <div className="absolute bottom-8 right-6 z-20 w-24">
                <div className="bg-[#051228] rounded-[18px] border-2 border-[#1a3a6b] overflow-hidden shadow-2xl shadow-indigo-900/30">
                  {/* Notch */}
                  <div className="flex justify-center pt-1.5 pb-1 bg-[#071a35]">
                    <div className="w-8 h-1 bg-[#0e2549] rounded-full" />
                  </div>
                  {/* Ekran içeriği */}
                  <div className="bg-[#0A1128] p-2 pb-3 flex flex-col gap-1.5">
                    <div className="h-3 bg-[#0e2549] rounded border border-[#1a3a6b]" />
                    {[
                      { c: 'bg-emerald-900/60 text-emerald-400', t: 'Onaylandı' },
                      { c: 'bg-yellow-900/60 text-yellow-400',   t: 'Bekliyor'  },
                      { c: 'bg-blue-900/60 text-blue-400',       t: 'Tamamlandı'},
                    ].map((r, i) => (
                      <div key={i} className="bg-[#0e2549] rounded-lg border border-[#1a3a6b] p-1.5">
                        <div className="h-1.5 bg-slate-600/50 rounded mb-1 w-2/3" />
                        <span className={`text-[7px] font-bold px-1 py-0.5 rounded ${r.c}`}>{r.t}</span>
                      </div>
                    ))}
                  </div>
                  {/* Home bar */}
                  <div className="flex justify-center pb-1.5 bg-[#0A1128]">
                    <div className="w-6 h-0.5 bg-slate-600 rounded-full" />
                  </div>
                </div>
              </div>

              {/* Arka dekoratif glow */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl" />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="border-y border-[#1a3a6b] bg-[#0e2549]/40 py-24 px-6" style={{ scrollMarginTop: '80px' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-[#0e2549] border border-[#1a3a6b] text-slate-400 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-5">Nasıl Çalışır</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">3 adımda operasyonunuzu yönetin</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Yönetici Atar',        desc: 'Yönetici, çalışana görev, vardiya ve bölge belirler. Sistem iş yükü dengesini otomatik hesaplar.',   color: 'text-indigo-400' },
              { step: '02', title: 'Çalışan Tamamlar',     desc: 'Çalışan görevi kamera fotoğrafıyla tamamlar. Gerçek zamanlı kayıt oluşturulur.',                      color: 'text-violet-400' },
              { step: '03', title: 'Yönetici Kontrol Eder', desc: 'Şef fotoğrafı inceler, onaylar veya reddeder. Denetim kaydına düşer.',                               color: 'text-emerald-400' },
            ].map((s, i) => (
              <div key={i} className="bg-[#071a35] rounded-2xl p-7 border border-[#1a3a6b]">
                <div className={`text-4xl font-extrabold ${s.color} opacity-40 mb-3`}>{s.step}</div>
                <h3 className="text-lg font-bold text-white mb-3">{s.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────
          BÖLÜM 3 — Temel Problemler ve Çözümleri
      ───────────────────────────────────────────────────────────────────── */}
      <section id="problems" className="max-w-6xl mx-auto px-6 py-28" style={{ scrollMarginTop: '80px' }}>
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-[#0e2549] border border-[#1a3a6b] text-slate-400 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-5">
            Acı Noktaları
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Bu sorunları tanıyor musunuz?
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Shift Pilot'ı geliştirirken sahadan duyduğumuz gerçek problemler.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              problemIcon: '💬',
              problemTitle: 'WhatsApp\'ta kaybolan molalar',
              problemDesc: 'Grup mesajlarında "geldim", "gittim" kaosu. Kim ne kadar mola yaptı? Bilmiyorsunuz.',
              solutionTitle: 'Mola Giriş Modülü',
              solutionDesc: 'Personelleriniz tek tıkla mola başlatır. WhatsApp\'taki karmaşa biter, kimin ne kadar mola yaptığı saniyesinde raporlanır.',
              accent: 'border-rose-800/50',
              iconBg: 'bg-rose-900/40',
              solBg: 'bg-rose-950/30',
            },
            {
              problemIcon: '⚖️',
              problemTitle: 'Adaletsiz görev dağılımı ve motivasyon kaybı',
              problemDesc: 'Hep aynı kişi ağır işleri yapıyor. Ekip içinde sesli söylenmeyen bir adaletsizlik birikior.',
              solutionTitle: 'Gelişmiş Katsayı Sistemi',
              solutionDesc: 'Zor görevleri adilce paylaştırın. Bir göreve birden fazla kişi mi atandı? Katsayı otomatik bölünür, emekler asla gözden kaçmaz.',
              accent: 'border-amber-800/50',
              iconBg: 'bg-amber-900/40',
              solBg: 'bg-amber-950/30',
            },
            {
              problemIcon: '📆',
              problemTitle: 'Her hafta sıfırdan çizelge hazırlama stresi',
              problemDesc: 'Pazartesi sabahı kim nerede çalışacak? Saatler harcanan, her hafta yenilenen o çizelge...',
              solutionTitle: 'Geçen Haftayı Getir',
              solutionDesc: 'Tek tıkla şablonu kopyalayın, resmi tatilleri ve özel izinleri görerek saniyeler içinde yeni haftayı planlayın.',
              accent: 'border-indigo-800/50',
              iconBg: 'bg-indigo-900/40',
              solBg: 'bg-indigo-950/30',
            },
          ].map((item, i) => (
            <div key={i} className={`bg-[#0a1930] border ${item.accent} rounded-2xl overflow-hidden flex flex-col`}>
              {/* Problem */}
              <div className="p-6 flex-1">
                <div className={`w-11 h-11 ${item.iconBg} rounded-xl flex items-center justify-center text-xl mb-4`}>
                  {item.problemIcon}
                </div>
                <h3 className="font-bold text-white text-base mb-2">{item.problemTitle}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{item.problemDesc}</p>
              </div>
              {/* Solution */}
              <div className={`${item.solBg} border-t border-white/5 p-5`}>
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">{item.solutionTitle}</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{item.solutionDesc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────
          BÖLÜM 4 — Özellikler ve Modüller (Deep Dive)
      ───────────────────────────────────────────────────────────────────── */}
      <section id="features" className="border-y border-[#1a3a6b] bg-[#0e2549]/30 py-28 px-6" style={{ scrollMarginTop: '80px' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-[#0e2549] border border-[#1a3a6b] text-slate-400 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-5">Modüller</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Özellikler ve Modüller</h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">Tüm operasyonunuz tek platformda — her modülü keşfedin.</p>
          </div>

          {/* Tab bar */}
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {[
              { label: 'Sürükle-Bırak Atama', icon: '🖱️' },
              { label: 'Çift Aşamalı Geri Bildirim', icon: '⭐' },
              { label: 'Denetim Günlüğü', icon: '🔍' },
              { label: 'PDF Eğitimleri', icon: '📄' },
            ].map((t, i) => (
              <button
                key={i}
                onClick={() => setFeatureTab(i)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                  featureTab === i
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/40'
                    : 'bg-[#071a35] border-[#1a3a6b] text-slate-400 hover:text-white hover:border-[#2a4a8b]'
                }`}
              >
                <span className="mr-1.5">{t.icon}</span>{t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="bg-[#071a35] border border-[#1a3a6b] rounded-3xl p-8 md:p-12">
            {featureTab === 0 && (
              <div className="grid md:grid-cols-2 gap-10 items-center">
                <div>
                  <div className="text-3xl mb-4">🖱️</div>
                  <h3 className="text-2xl font-extrabold text-white mb-4">Sürükle-Bırak Atama</h3>
                  <p className="text-slate-400 leading-relaxed text-base mb-6">
                    Personeliniz solda, görevler sağda. Sadece sürükleyin ve bırakın. Tek seferlik, rutin veya tekrarlayan görevleri saniyeler içinde planlayın.
                  </p>
                  <ul className="space-y-3">
                    {['Tek tıkla toplu atama', 'İş yükü dengesi otomatik hesaplanır', 'Geçen haftanın çizelgesini tek tıkla kopyala'].map((f, i) => (
                      <li key={i} className="flex items-center gap-2.5 text-sm text-slate-300"><CheckIcon />{f}</li>
                    ))}
                  </ul>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {['Ayşe K. → Masa Temizliği', 'Mehmet D. → Stok Sayımı', 'Fatma S. → Müşteri Karşılama', 'Ali R. → Ekipman Kontrolü'].map((a, i) => (
                    <div key={i} className="bg-[#0e2549] border border-[#1a3a6b] rounded-xl p-3 text-xs text-slate-300 font-medium">
                      <div className="text-[10px] text-indigo-400 font-bold mb-1">ATAMA</div>
                      {a}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {featureTab === 1 && (
              <div className="grid md:grid-cols-2 gap-10 items-center">
                <div>
                  <div className="text-3xl mb-4">⭐</div>
                  <h3 className="text-2xl font-extrabold text-white mb-4">Çift Aşamalı Geri Bildirim</h3>
                  <p className="text-slate-400 leading-relaxed text-base mb-6">
                    Hem müşteriden gelen 5 yıldızlı bildirimleri sınıflandırın hem de şeflerin personeli nasıl yönettiğini takip edin.
                  </p>
                  <ul className="space-y-3">
                    {['Müşteri değerlendirmeleri kategorize edilir', 'Şef performansı ayrı izlenir', 'Yönetici panelinde filtrelenebilir raporlar'].map((f, i) => (
                      <li key={i} className="flex items-center gap-2.5 text-sm text-slate-300"><CheckIcon />{f}</li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Temizlik', stars: 5, type: 'Müşteri', color: 'text-amber-400' },
                    { label: 'Servis Hızı', stars: 4, type: 'Müşteri', color: 'text-amber-400' },
                    { label: 'Personel Performansı', stars: 5, type: 'Şef Değerlendirmesi', color: 'text-indigo-400' },
                  ].map((fb, i) => (
                    <div key={i} className="bg-[#0e2549] border border-[#1a3a6b] rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <div className={`text-[10px] font-bold ${fb.color} mb-1`}>{fb.type}</div>
                        <div className="text-sm text-white font-semibold">{fb.label}</div>
                      </div>
                      <div className="text-amber-400 text-sm">{'★'.repeat(fb.stars)}{'☆'.repeat(5 - fb.stars)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {featureTab === 2 && (
              <div className="grid md:grid-cols-2 gap-10 items-center">
                <div>
                  <div className="text-3xl mb-4">🔍</div>
                  <h3 className="text-2xl font-extrabold text-white mb-4">Detaylı Denetim ve Etkinlik Günlüğü</h3>
                  <p className="text-slate-400 leading-relaxed text-base mb-6">
                    Müdürler için tam şeffaflık. Görevi kim onayladı, nasıl onayladı, kim neyi değiştirdi? Hepsi denetim altında.
                  </p>
                  <ul className="space-y-3">
                    {['Her onay ve red kayıt altında', 'Kimin ne yaptığını anlık izleyin', 'Tarih aralığı ile filtrelenebilir'].map((f, i) => (
                      <li key={i} className="flex items-center gap-2.5 text-sm text-slate-300"><CheckIcon />{f}</li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-2">
                  {[
                    { action: 'Onaylandı', user: 'Şef Caner', task: 'Masa Temizliği', time: '09:14', color: 'text-emerald-400' },
                    { action: 'Reddedildi', user: 'Şef Elif', task: 'Stok Sayımı', time: '10:02', color: 'text-rose-400' },
                    { action: 'Atandı', user: 'Müdür Ahmet', task: 'Ekipman Kontrolü', time: '08:45', color: 'text-indigo-400' },
                    { action: 'Tamamlandı', user: 'Personel Selin', task: 'Bar Temizliği', time: '11:30', color: 'text-blue-400' },
                  ].map((log, i) => (
                    <div key={i} className="bg-[#0e2549] border border-[#1a3a6b] rounded-xl px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-bold ${log.color}`}>{log.action}</span>
                        <span className="text-xs text-slate-400">{log.user} · {log.task}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">{log.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {featureTab === 3 && (
              <div className="grid md:grid-cols-2 gap-10 items-center">
                <div>
                  <div className="text-3xl mb-4">📄</div>
                  <h3 className="text-2xl font-extrabold text-white mb-4">PDF Eğitimleri ve Testler</h3>
                  <p className="text-slate-400 leading-relaxed text-base mb-6">
                    İşletmenizin standartlarını koruyun. Eğitim dökümanlarınızı paylaşın, personelinize minik testler uygulayarak gelişimlerini ölçün.
                  </p>
                  <ul className="space-y-3">
                    {['PDF döküman yükleme ve paylaşma', 'Role özel erişim kısıtlamaları', 'Gelişim takibi ve tamamlanma raporu'].map((f, i) => (
                      <li key={i} className="flex items-center gap-2.5 text-sm text-slate-300"><CheckIcon />{f}</li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-3">
                  {[
                    { title: 'Hijyen ve Sanitasyon Kılavuzu', pages: '12 sayfa', role: 'Tüm Personel', status: 'Tamamlandı' },
                    { title: 'Müşteri İletişim Protokolleri', pages: '8 sayfa', role: 'Şefler', status: 'Okunmadı' },
                    { title: 'Acil Durum Prosedürleri', pages: '5 sayfa', role: 'Tüm Personel', status: 'Tamamlandı' },
                  ].map((doc, i) => (
                    <div key={i} className="bg-[#0e2549] border border-[#1a3a6b] rounded-xl p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-sm text-white font-semibold mb-1">{doc.title}</div>
                          <div className="text-[10px] text-slate-500">{doc.pages} · {doc.role}</div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${doc.status === 'Tamamlandı' ? 'bg-emerald-900/60 text-emerald-400' : 'bg-yellow-900/60 text-yellow-400'}`}>{doc.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────
          BÖLÜM 5 — Rollere Göre Shift Pilot
      ───────────────────────────────────────────────────────────────────── */}
      <section id="roles" className="max-w-5xl mx-auto px-6 py-28" style={{ scrollMarginTop: '80px' }}>
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-[#0e2549] border border-[#1a3a6b] text-slate-400 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-5">Roller</div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Shift Pilot size ne katacak?</h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">Rolünüzü seçin ve size özel faydaları keşfedin.</p>
        </div>

        {/* Role tabs */}
        <div className="flex gap-2 justify-center mb-10 p-1.5 bg-[#0a1930] border border-[#1a3a6b] rounded-2xl w-fit mx-auto">
          {[
            { label: 'Yönetici', icon: '👔' },
            { label: 'Şef',      icon: '🎯' },
            { label: 'Personel', icon: '👷' },
          ].map((r, i) => (
            <button
              key={i}
              onClick={() => setRoleTab(i)}
              className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                roleTab === i
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="mr-1.5">{r.icon}</span>{r.label}
            </button>
          ))}
        </div>

        <div className="bg-gradient-to-br from-[#0e2549] to-[#071a35] border border-[#1a3a6b] rounded-3xl p-8 md:p-12">
          {roleTab === 0 && (
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <div className="text-4xl mb-4">👔</div>
                <h3 className="text-2xl font-bold text-white mb-3">Yönetici Bakış Açısı</h3>
                <p className="text-slate-400 leading-relaxed mb-6">
                  Performans metriklerini, mola sürelerini ve denetim raporlarını anlık izleyin. İşletmenizin verimliliğini artırın.
                </p>
                <ul className="space-y-3">
                  {['Tüm personelinizin anlık performansını görün', 'Görev tamamlanma ve onay oranlarını takip edin', 'Mola sürelerini ve iş yükü dağılımını analiz edin', 'Denetim kaydıyla her kararın izini sürün'].map((f, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-sm text-slate-300"><CheckIcon />{f}</li>
                  ))}
                </ul>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Toplam Atama', value: '127', color: 'text-indigo-400' },
                  { label: 'Onay Oranı', value: '%94', color: 'text-emerald-400' },
                  { label: 'Mola Ortalaması', value: '22 dk', color: 'text-amber-400' },
                  { label: 'Aktif Personel', value: '18', color: 'text-violet-400' },
                ].map((s, i) => (
                  <div key={i} className="bg-[#071a35] border border-[#1a3a6b] rounded-2xl p-5 text-center">
                    <div className={`text-2xl font-extrabold ${s.color} mb-1`}>{s.value}</div>
                    <div className="text-[11px] text-slate-500">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {roleTab === 1 && (
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-2xl font-bold text-white mb-3">Şef Bakış Açısı</h3>
                <p className="text-slate-400 leading-relaxed mb-6">
                  Bölgeleri yönetin, sürükle-bırak ile görevleri hızlıca dağıtın, gün içi operasyonu stressiz yönetin.
                </p>
                <ul className="space-y-3">
                  {['Bölge bazlı personel yerleşimi görün', 'Bekleyen görev onaylarını tek ekrandan yönetin', 'Personeli değerlendirin ve geri bildirim verin', 'Günlük operasyonu gerçek zamanlı takip edin'].map((f, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-sm text-slate-300"><CheckIcon />{f}</li>
                  ))}
                </ul>
              </div>
              <div className="space-y-3">
                {[
                  { zone: 'Salon — VIP Alan', count: 3, status: 'Tamamlandı' },
                  { zone: 'Bar / İçecek', count: 2, status: 'Bekliyor' },
                  { zone: 'Sıcak Mutfak', count: 4, status: 'Tamamlandı' },
                ].map((z, i) => (
                  <div key={i} className="bg-[#071a35] border border-[#1a3a6b] rounded-xl px-5 py-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-white">{z.zone}</div>
                      <div className="text-[11px] text-slate-500">{z.count} personel</div>
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${z.status === 'Tamamlandı' ? 'bg-emerald-900/60 text-emerald-400' : 'bg-yellow-900/60 text-yellow-400'}`}>{z.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {roleTab === 2 && (
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <div className="text-4xl mb-4">👷</div>
                <h3 className="text-2xl font-bold text-white mb-3">Personel Bakış Açısı</h3>
                <p className="text-slate-400 leading-relaxed mb-6">
                  Kendi izinlerinizi, mesailerinizi ve günlük görevlerinizi tek ekrandan görün. Adil puanlama sistemiyle emeğinizin karşılığını alın.
                </p>
                <ul className="space-y-3">
                  {['Günlük görevlerinizi listede görün', 'Kamera ile fotoğraf çekerek görevi tamamlayın', 'Mola başlatıp bitirebilirsiniz', 'Kendi performans puanlarınızı takip edin'].map((f, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-sm text-slate-300"><CheckIcon />{f}</li>
                  ))}
                </ul>
              </div>
              <div className="space-y-3">
                {[
                  { task: 'Masa Düzeni Kontrolü', zone: 'Salon', time: '08:30', status: 'Onaylandı' },
                  { task: 'Bar Temizliği', zone: 'Bar', time: '10:00', status: 'Tamamlandı' },
                  { task: 'Stok Sayımı', zone: 'Depo', time: '14:00', status: 'Bekliyor' },
                ].map((t, i) => (
                  <div key={i} className="bg-[#071a35] border border-[#1a3a6b] rounded-xl px-5 py-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-white">{t.task}</div>
                      <div className="text-[11px] text-slate-500">{t.zone} · {t.time}</div>
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${t.status === 'Onaylandı' ? 'bg-emerald-900/60 text-emerald-400' : t.status === 'Tamamlandı' ? 'bg-blue-900/60 text-blue-400' : 'bg-yellow-900/60 text-yellow-400'}`}>{t.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────
          BÖLÜM 6 — SSS
      ───────────────────────────────────────────────────────────────────── */}
      <section id="faq" className="border-t border-[#1a3a6b] bg-[#0e2549]/20 py-28 px-6" style={{ scrollMarginTop: '80px' }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-[#0e2549] border border-[#1a3a6b] text-slate-400 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-5">SSS</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Sıkça Sorulan Sorular</h2>
            <p className="text-slate-400 text-lg">Aklınızdaki son soru işaretlerini giderelim.</p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: 'Shift Pilot\'ı kullanmak için bir eğitim gerekiyor mu?',
                a: 'Hayır. Sürükle-bırak mantığıyla çalışan arayüzümüzü herkes 10 dakikada öğrenebilir. Ek olarak uygulama içinde "Kullanım Kılavuzu" bölümü de mevcuttur.',
              },
              {
                q: 'Tekrarlayan görevler her gün otomatik mi atanıyor?',
                a: 'Evet. Günlük, haftalık veya aylık olarak tanımladığınız görevler otomatik olarak sisteme düşer. Her gün aynı görevi elle girmekle uğraşmazsınız.',
              },
              {
                q: 'Özel gün ve resmi tatiller sistemde tanımlı mı?',
                a: 'Evet. Resmi tatiller çizelgenizde otomatik olarak görünür. Özel izin ve off günleri de çizelge ekranından kolayca işaretlenebilir.',
              },
              {
                q: 'Kaç kişilik ekiplerle çalışıyor?',
                a: 'Shift Pilot; 5 kişilik küçük kafelerden 50+ kişilik restoran zincirlerine kadar ölçeklenebilir. Kullanıcı sayısına göre özel fiyatlandırma sunuyoruz.',
              },
              {
                q: 'Verilerim güvende mi?',
                a: 'Tüm veriler şifreli bağlantı (HTTPS) üzerinden iletilir ve güvenli bulut altyapısında saklanır. Fotoğraflar yalnızca yetkili kullanıcılar tarafından görüntülenebilir.',
              },
            ].map((item, i) => (
              <details key={i} className="group bg-[#071a35] border border-[#1a3a6b] rounded-2xl overflow-hidden">
                <summary className="flex items-center justify-between px-6 py-5 cursor-pointer list-none hover:bg-[#0e2549]/50 transition-colors">
                  <span className="font-semibold text-white text-sm md:text-base pr-4">{item.q}</span>
                  <svg className="w-5 h-5 text-slate-400 flex-shrink-0 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-6 pb-5 pt-1 text-slate-400 text-sm leading-relaxed border-t border-[#1a3a6b]">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING / CONTACT */}
      <section id="pricing" className="max-w-3xl mx-auto px-6 py-28 text-center" style={{ scrollMarginTop: '80px' }}>
        <div className="inline-flex items-center gap-2 bg-[#0e2549] border border-[#1a3a6b] text-slate-400 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-7">Fiyatlandırma</div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-5">İşletmenize özel teklif alın</h2>
        <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto leading-relaxed">
          Her işletmenin ihtiyacı farklıdır. Bizimle iletişime geçin, size en uygun çözümü birlikte belirleyelim.
        </p>
        <a
          href="mailto:info@appshiftpilot.com"
          className="inline-flex items-center gap-3 bg-[#0e2549] border border-[#1a3a6b] hover:border-indigo-600 hover:bg-[#1a3a6b] transition-colors rounded-2xl px-8 py-4 text-white font-semibold text-lg"
        >
          <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          info@appshiftpilot.com
        </a>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#1a3a6b] bg-[#051228]">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Image src="/logos/logo-dark.png" alt="ShiftPilot" width={120} height={40} className="h-10 w-auto object-contain" />
          <p className="text-xs text-slate-500">© 2026 ShiftPilot. Tüm hakları saklıdır.</p>
          <div className="flex gap-5 text-xs text-slate-500">
            <a href="#" className="hover:text-slate-300 transition-colors">Gizlilik</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Kullanım Koşulları</a>
            <a href="mailto:info@appshiftpilot.com" className="hover:text-slate-300 transition-colors">İletişim</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
