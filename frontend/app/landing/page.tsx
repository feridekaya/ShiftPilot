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

function ArrowRight() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  );
}

function AppMockup() {
  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* Floating card — top left */}
      <div className="absolute -left-10 top-8 z-10 bg-[#0e2549] rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3 border border-[#1a3a6b]">
        <div className="w-9 h-9 rounded-xl bg-emerald-900/60 flex items-center justify-center">
          <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <div className="text-[11px] text-slate-400 font-medium">Eksik Görev</div>
          <div className="text-sm font-bold text-white">Sıfır</div>
        </div>
      </div>

      {/* Floating card — top right */}
      <div className="absolute -right-8 top-16 z-10 bg-[#0e2549] rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3 border border-[#1a3a6b]">
        <div className="w-9 h-9 rounded-xl bg-violet-900/60 flex items-center justify-center">
          <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <div className="text-[11px] text-slate-400 font-medium">Görev Onayı</div>
          <div className="text-sm font-bold text-white">Anlık bildirim</div>
        </div>
      </div>

      {/* Floating card — bottom left */}
      <div className="absolute -left-8 bottom-12 z-10 bg-[#0e2549] rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3 border border-[#1a3a6b]">
        <div className="w-9 h-9 rounded-xl bg-orange-900/60 flex items-center justify-center">
          <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <div className="text-[11px] text-slate-400 font-medium">Denetim</div>
          <div className="text-sm font-bold text-white">7/24 canlı takip</div>
        </div>
      </div>

      {/* Main mockup window */}
      <div className="relative bg-[#071a35] rounded-3xl shadow-2xl border border-[#1a3a6b] overflow-hidden">
        {/* Window chrome */}
        <div className="bg-[#051228] px-4 py-3 flex items-center gap-2 border-b border-[#1a3a6b]">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
          <div className="flex-1 mx-4">
            <div className="bg-[#0e2549] rounded-lg px-3 py-1 text-[11px] text-slate-400 text-center border border-[#1a3a6b]">
              appshiftpilot.com
            </div>
          </div>
        </div>

        {/* App content */}
        <div className="p-4 min-h-[340px]">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-slate-300">Bugün — Pzt 11 Nis</span>
            </div>
            <div className="flex gap-1.5">
              <div className="text-[10px] bg-indigo-600 text-white px-2.5 py-1 rounded-lg font-medium">Atamalar</div>
              <div className="text-[10px] bg-[#0e2549] text-slate-400 px-2.5 py-1 rounded-lg font-medium border border-[#1a3a6b]">Çizelge</div>
              <div className="text-[10px] bg-[#0e2549] text-slate-400 px-2.5 py-1 rounded-lg font-medium border border-[#1a3a6b]">Denetim</div>
            </div>
          </div>

          {/* Assignment cards */}
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
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                    item.status === 'approved' ? 'bg-emerald-900/60 text-emerald-400' :
                    item.status === 'completed' ? 'bg-blue-900/60 text-blue-400' :
                    'bg-yellow-900/60 text-yellow-400'
                  }`}>
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

          {/* Bottom stats */}
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

  return (
    <div className="min-h-screen bg-[#071a35] text-white" style={{ scrollBehavior: 'smooth' }}>

      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-[#071a35]/95 backdrop-blur-md border-b border-[#1a3a6b]">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between py-2">
          <Image
            src="/logos/logo-dark.png"
            alt="ShiftPilot"
            width={180}
            height={60}
            className="h-14 w-auto object-contain"
            priority
          />

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Özellikler</a>
            <a href="#how" className="hover:text-white transition-colors">Nasıl Çalışır</a>
            <a href="#pricing" className="hover:text-white transition-colors">Fiyatlandırma</a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors px-3 py-1.5">
              Giriş Yap
            </Link>
            <Link
              href="/login"
              className="text-sm font-semibold text-white px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/40"
            >
              Kullanmaya Başla
            </Link>
          </div>

          <button
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d={mobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#1a3a6b] bg-[#071a35] px-6 py-4 flex flex-col gap-4 text-sm font-medium text-slate-400">
            <a href="#features" onClick={() => setMobileMenuOpen(false)}>Özellikler</a>
            <a href="#how" onClick={() => setMobileMenuOpen(false)}>Nasıl Çalışır</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Fiyatlandırma</a>
            <Link href="/login" className="text-white font-semibold">Giriş Yap</Link>
            <Link href="/login" className="text-center text-white font-semibold px-5 py-2.5 rounded-xl bg-indigo-600 shadow-lg">
              Kullanmaya Başla
            </Link>
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

          <div className="flex flex-wrap gap-4 mb-12">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-white font-semibold px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/40 text-base"
            >
              Kullanmaya Başla
              <ArrowRight />
            </Link>
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
            {
              icon: (
                <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              ),
              label: 'VERİMLİLİK',
              value: 'Artış sağlar',
              desc: 'Görev dağılımı optimize edilince personel verimliliği yükseliyor.',
              border: 'border-indigo-800/40',
              bg: 'bg-indigo-950/50',
            },
            {
              icon: (
                <svg className="w-6 h-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              ),
              label: 'HATA ORANI',
              value: 'Sıfır atlanmış görev',
              desc: 'Unutulan veya eksik yapılan görevleri hemen tespit edersiniz.',
              border: 'border-violet-800/40',
              bg: 'bg-violet-950/50',
            },
            {
              icon: (
                <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              ),
              label: 'DENETİM',
              value: '7/24 canlı takip',
              desc: 'Denetim kaydı ve fotoğraflı kanıt her zaman elinizin altında.',
              border: 'border-emerald-800/40',
              bg: 'bg-emerald-950/50',
            },
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

      {/* FEATURES */}
      <section id="features" className="max-w-7xl mx-auto px-6 pb-28" style={{ scrollMarginTop: '80px' }}>
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-[#0e2549] border border-[#1a3a6b] text-slate-400 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-5">
            Özellikler
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Tüm operasyonunuz tek platformda
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Görev atamadan fotoğraflı denetime, mola takibinden performans raporuna.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              emoji: '📅',
              title: 'Vardiyaları Belirleyin',
              desc: 'Sabah, akşam, gece vardiyalarını tanımlayın. Çalışanları uygun vardiyalara atayın.',
              accent: 'bg-indigo-900/40 border-indigo-800/40',
              dot: 'text-indigo-400',
            },
            {
              emoji: '📋',
              title: 'Görevler Oluşturun',
              desc: 'Bölge ve vardiya bazlı görevler tanımlayın. İş yükü dengeleme otomatik hesaplanır.',
              accent: 'bg-violet-900/40 border-violet-800/40',
              dot: 'text-violet-400',
            },
            {
              emoji: '📸',
              title: 'Fotoğraflı Tamamlama',
              desc: 'Çalışanlar görevi yalnızca kamera fotoğrafıyla tamamlar — galeri kullanımı engellenir.',
              accent: 'bg-orange-900/40 border-orange-800/40',
              dot: 'text-orange-400',
            },
            {
              emoji: '☕',
              title: 'Molaları Takip Edin',
              desc: 'Kısa ve yemek molalarını kayıt altına alın, günlük ortalamaları görüntüleyin.',
              accent: 'bg-pink-900/40 border-pink-800/40',
              dot: 'text-pink-400',
            },
            {
              emoji: '📊',
              title: 'Performans Raporları',
              desc: 'Görev tamamlama oranları, denetim kaydı ve çalışan performansını raporlayın.',
              accent: 'bg-emerald-900/40 border-emerald-800/40',
              dot: 'text-emerald-400',
            },
            {
              emoji: '💬',
              title: 'Müşteri Geri Bildirimleri',
              desc: 'Müşterilerinizin geri bildirimlerini tek noktada toplayın, takip edin.',
              accent: 'bg-blue-900/40 border-blue-800/40',
              dot: 'text-blue-400',
            },
          ].map((f, i) => (
            <div key={i} className={`${f.accent} border rounded-2xl p-6 hover:border-white/20 transition-colors`}>
              <div className="text-2xl mb-4">{f.emoji}</div>
              <h3 className="font-bold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="border-y border-[#1a3a6b] bg-[#0e2549]/40 py-24 px-6" style={{ scrollMarginTop: '80px' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-[#0e2549] border border-[#1a3a6b] text-slate-400 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-5">
              Nasıl Çalışır
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">3 adımda operasyonunuzu yönetin</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Yönetici Atar',
                desc: 'Yönetici, çalışana görev, vardiya ve bölge belirler. Sistem iş yükü dengesini otomatik hesaplar.',
                color: 'text-indigo-400',
              },
              {
                step: '02',
                title: 'Çalışan Tamamlar',
                desc: 'Çalışan görevi kamera fotoğrafıyla tamamlar. Gerçek zamanlı kayıt oluşturulur.',
                color: 'text-violet-400',
              },
              {
                step: '03',
                title: 'Yönetici Kontrol Eder',
                desc: 'Şef fotoğrafı inceler, onaylar veya reddeder. Denetim kaydına düşer.',
                color: 'text-emerald-400',
              },
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

      {/* PRICING / CONTACT */}
      <section id="pricing" className="max-w-3xl mx-auto px-6 py-28 text-center" style={{ scrollMarginTop: '80px' }}>
        <div className="inline-flex items-center gap-2 bg-[#0e2549] border border-[#1a3a6b] text-slate-400 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-7">
          Fiyatlandırma
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-5">
          İşletmenize özel teklif alın
        </h2>
        <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto leading-relaxed">
          Her işletmenin ihtiyacı farklıdır. Bizimle iletişime geçin, size en uygun çözümü birlikte belirleyelim.
        </p>
        <a
          href="mailto:info@appshiftpilot.com"
          className="inline-flex items-center gap-3 bg-[#0e2549] border border-[#1a3a6b] hover:border-indigo-600 hover:bg-[#1a3a6b] transition-colors rounded-2xl px-8 py-4 text-white font-semibold text-lg"
        >
          <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          info@appshiftpilot.com
        </a>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#1a3a6b] bg-[#051228]">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Image
            src="/logos/logo-dark.png"
            alt="ShiftPilot"
            width={120}
            height={40}
            className="h-10 w-auto object-contain"
          />
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
