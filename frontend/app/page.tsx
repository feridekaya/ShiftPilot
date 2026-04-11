'use client';

import Link from 'next/link';
import { useState } from 'react';

function CheckIcon() {
  return (
    <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function AppMockup() {
  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* Floating card — top left */}
      <div className="absolute -left-10 top-8 z-10 bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 border border-gray-100">
        <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <div>
          <div className="text-[11px] text-gray-400 font-medium">Verimlilik</div>
          <div className="text-sm font-bold text-gray-800">+%40 artış</div>
        </div>
      </div>

      {/* Floating card — top right */}
      <div className="absolute -right-8 top-16 z-10 bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 border border-gray-100">
        <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <div className="text-[11px] text-gray-400 font-medium">Görev Onayı</div>
          <div className="text-sm font-bold text-gray-800">Anlık bildirim</div>
        </div>
      </div>

      {/* Floating card — bottom left */}
      <div className="absolute -left-8 bottom-12 z-10 bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 border border-gray-100">
        <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <div className="text-[11px] text-gray-400 font-medium">Denetim</div>
          <div className="text-sm font-bold text-gray-800">7/24 canlı takip</div>
        </div>
      </div>

      {/* Main mockup window */}
      <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Window chrome */}
        <div className="bg-gray-100 px-4 py-3 flex items-center gap-2 border-b border-gray-200">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-emerald-400" />
          <div className="flex-1 mx-4">
            <div className="bg-white rounded-lg px-3 py-1 text-[11px] text-gray-400 text-center border border-gray-200">
              app.shiftpilot.co
            </div>
          </div>
        </div>

        {/* App content */}
        <div className="p-4 bg-gradient-to-br from-slate-50 to-white min-h-[340px]">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-gray-700">Bugün — Pzt 11 Nis</span>
            </div>
            <div className="flex gap-1.5">
              <div className="text-[10px] bg-violet-600 text-white px-2.5 py-1 rounded-lg font-medium">Atamalar</div>
              <div className="text-[10px] bg-gray-100 text-gray-500 px-2.5 py-1 rounded-lg font-medium">Çizelge</div>
              <div className="text-[10px] bg-gray-100 text-gray-500 px-2.5 py-1 rounded-lg font-medium">Denetim</div>
            </div>
          </div>

          {/* Assignment cards */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {[
              { name: 'Ayşe K.', task: 'Masa Temizliği', zone: 'Ön Salon', shift: 'Sabah', status: 'approved', color: 'emerald' },
              { name: 'Mehmet D.', task: 'Stok Sayımı', zone: 'Depo', shift: 'Akşam', status: 'pending', color: 'yellow' },
              { name: 'Fatma S.', task: 'Müşteri Karşılama', zone: 'Giriş', shift: 'Sabah', status: 'completed', color: 'blue' },
              { name: 'Ali R.', task: 'Ekipman Kontrolü', zone: 'Mutfak', shift: 'Akşam', status: 'pending', color: 'yellow' },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-2.5 shadow-sm">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-gray-700">{item.name}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                    item.color === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
                    item.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {item.status === 'approved' ? 'Onaylandı' : item.status === 'completed' ? 'Tamamlandı' : 'Bekliyor'}
                  </span>
                </div>
                <div className="text-[10px] font-medium text-gray-800 mb-1">{item.task}</div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-gray-400">📍{item.zone}</span>
                  <span className="text-[9px] text-gray-400">⏱{item.shift}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom stats row */}
          <div className="flex gap-2">
            {[
              { label: 'Toplam Görev', value: '12', bg: 'bg-violet-50', text: 'text-violet-700' },
              { label: 'Tamamlanan', value: '8', bg: 'bg-emerald-50', text: 'text-emerald-700' },
              { label: 'Bekleyen', value: '4', bg: 'bg-orange-50', text: 'text-orange-700' },
            ].map((s, i) => (
              <div key={i} className={`flex-1 ${s.bg} rounded-xl px-3 py-2 text-center`}>
                <div className={`text-base font-bold ${s.text}`}>{s.value}</div>
                <div className="text-[9px] text-gray-500 font-medium">{s.label}</div>
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
    <div className="min-h-screen bg-gradient-to-br from-[#F3F4F6] via-[#F8F8FF] to-white">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shadow-md">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="text-lg font-bold text-gray-900 tracking-tight">ShiftPilot</span>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-gray-900 transition-colors">Özellikler</a>
            <a href="#how" className="hover:text-gray-900 transition-colors">Nasıl Çalışır</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Fiyatlandırma</a>
            <a href="#guide" className="hover:text-gray-900 transition-colors">Tutorial / Rehber</a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-3 py-1.5">
              Giriş Yap
            </Link>
            <Link
              href="/login"
              className="text-sm font-semibold text-white px-5 py-2 rounded-2xl bg-gradient-to-r from-violet-600 to-orange-500 hover:opacity-90 transition-opacity shadow-lg"
            >
              Ücretsiz Kullanmaya Başla
            </Link>
          </div>

          <button
            className="md:hidden p-2 rounded-lg text-gray-500"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d={mobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-6 py-4 flex flex-col gap-4 text-sm font-medium text-gray-600">
            <a href="#features">Özellikler</a>
            <a href="#how">Nasıl Çalışır</a>
            <a href="#pricing">Fiyatlandırma</a>
            <a href="#guide">Tutorial / Rehber</a>
            <Link href="/login" className="text-gray-900 font-semibold">Giriş Yap</Link>
            <Link href="/login" className="text-center text-white font-semibold px-5 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-orange-500 shadow-lg">
              Ücretsiz Kullanmaya Başla
            </Link>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div>
          <div className="inline-flex items-center gap-2 bg-violet-50 border border-violet-200 text-violet-700 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
            Vardiya ve operasyonu dijitalleştirin
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-[1.1] tracking-tight mb-6">
            Vardiyayı Yöneten{' '}
            <span className="bg-gradient-to-r from-violet-600 to-orange-500 bg-clip-text text-transparent">
              Akıllı Operasyon
            </span>{' '}
            Sistemi
          </h1>

          <p className="text-lg text-gray-500 leading-relaxed mb-10 max-w-lg">
            ShiftPilot; vardiya çizelgesi, görev atama ve performans takibini tek ekranda toplar.
            Kaosu bitirir — personelin verimliliğini ve dükkanın huzurunu herkes görür.
          </p>

          <div className="flex flex-wrap gap-4 mb-12">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-white font-semibold px-7 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-orange-500 hover:opacity-90 transition-opacity shadow-lg text-base"
            >
              Hemen Kullanmaya Başla
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <a
              href="#demo"
              className="inline-flex items-center gap-2 text-violet-700 font-semibold px-7 py-3.5 rounded-2xl bg-violet-50 hover:bg-violet-100 transition-colors border border-violet-200 text-base"
            >
              Canlı Demo&#39;yu Kullan ✦
            </a>
          </div>

          <ul className="flex flex-col gap-3 text-sm text-gray-600">
            {[
              'Fotoğraflı görev tamamlama — galeri yasağı, sadece kamera',
              'Çakışmayan otomatik iş yükü dengeleme',
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
                <svg className="w-6 h-6 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              ),
              label: 'VERİMLİLİK',
              value: '+%40 artış',
              desc: 'Görev dağılımı optimize edilince personel verimliliği yükseliyor.',
              bg: 'bg-violet-50',
              border: 'border-violet-100',
            },
            {
              icon: (
                <svg className="w-6 h-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              ),
              label: 'HATA ORANI',
              value: '%0 çakışan vardiya',
              desc: 'Çizelge mantığı çift rezervasyon ve çakışmaları sıfırlar.',
              bg: 'bg-orange-50',
              border: 'border-orange-100',
            },
            {
              icon: (
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              ),
              label: 'DENETİM',
              value: '7/24 canlı takip',
              desc: 'Denetim kaydı ve fotoğraflı kanıt her zaman elinizin altında.',
              bg: 'bg-emerald-50',
              border: 'border-emerald-100',
            },
          ].map((card, i) => (
            <div key={i} className={`${card.bg} border ${card.border} rounded-2xl p-6 shadow-sm`}>
              <div className="mb-3">{card.icon}</div>
              <div className="text-[10px] font-bold tracking-widest text-gray-400 mb-1">{card.label}</div>
              <div className="text-2xl font-extrabold text-gray-900 mb-2">{card.value}</div>
              <p className="text-sm text-gray-500 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="max-w-7xl mx-auto px-6 pb-28">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-500 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-5">
            Özellikler
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            Tüm operasyonunuz tek platformda
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Görev atamadan fotoğraflı denetime, mola takibinden performans raporuna.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { emoji: '📋', title: 'Görev Atama', desc: 'Çalışanlara vardiya ve bölge bazlı görev ata. İş yükü dengeleme otomatik hesaplanır.', color: 'bg-violet-100 text-violet-700' },
            { emoji: '📸', title: 'Fotoğraflı Tamamlama', desc: 'Çalışanlar görevi yalnızca kamera fotoğrafıyla tamamlar — galeri kullanımı engellenir.', color: 'bg-orange-100 text-orange-700' },
            { emoji: '✅', title: 'Supervisor Onayı', desc: 'Süpervizörler fotoğraflı gönderimleri tek ekrandan onaylar veya reddeder.', color: 'bg-emerald-100 text-emerald-700' },
            { emoji: '📅', title: 'Haftalık Çizelge', desc: 'Çalışma çizelgesini haftalık görünümde yönet, izin günlerini işaretle.', color: 'bg-blue-100 text-blue-700' },
            { emoji: '☕', title: 'Mola Takibi', desc: 'Kısa ve yemek molalarını kayıt altına al, günlük ortalamaları görüntüle.', color: 'bg-pink-100 text-pink-700' },
            { emoji: '📊', title: 'Performans Raporları', desc: 'Görev tamamlama oranları, denetim kaydı ve çalışan performansını raporla.', color: 'bg-yellow-100 text-yellow-700' },
          ].map((f, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-4 ${f.color}`}>
                {f.emoji}
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="bg-gradient-to-br from-violet-600 to-indigo-700 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-white/20 text-white text-xs font-semibold px-3.5 py-1.5 rounded-full mb-5">
              Nasıl Çalışır
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">3 adımda operasyonunuzu yönetin</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Yönetici Atar', desc: 'Manager, çalışana görev, vardiya ve bölge belirler. Sistem iş yükü dengesini otomatik hesaplar.' },
              { step: '02', title: 'Çalışan Tamamlar', desc: 'Çalışan görevi kamera fotoğrafıyla tamamlar. Gerçek zamanlı kayıt oluşturulur.' },
              { step: '03', title: 'Supervisor Onaylar', desc: 'Süpervizör fotoğrafı inceler, onaylar veya reddeder. Denetim kaydına düşer.' },
            ].map((s, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-7 border border-white/20">
                <div className="text-4xl font-extrabold text-white/20 mb-3">{s.step}</div>
                <h3 className="text-lg font-bold text-white mb-3">{s.title}</h3>
                <p className="text-sm text-white/70 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-5">
          Restoranınızın operasyonunu<br />bugün dijitalleştirin
        </h2>
        <p className="text-gray-500 text-lg mb-10">Ücretsiz başlayın. Kurulum gerektirmez.</p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-white font-semibold px-9 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-orange-500 hover:opacity-90 transition-opacity shadow-xl text-base"
        >
          Ücretsiz Kullanmaya Başla
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="font-bold text-gray-800 text-sm">ShiftPilot</span>
          </div>
          <p className="text-xs text-gray-400">© 2026 ShiftPilot. Tüm hakları saklıdır.</p>
          <div className="flex gap-5 text-xs text-gray-400">
            <a href="#" className="hover:text-gray-600 transition-colors">Gizlilik</a>
            <a href="#" className="hover:text-gray-600 transition-colors">Kullanım Koşulları</a>
            <a href="#" className="hover:text-gray-600 transition-colors">İletişim</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
