'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarLink {
  href: string;
  label: string;
}

interface SidebarProps {
  links: SidebarLink[];
  isOpen?: boolean;
  onClose?: () => void;
}

function NavLinks({ links, pathname, onClose }: { links: SidebarLink[]; pathname: string; onClose?: () => void }) {
  return (
    <>
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClose}
            className={`px-4 py-2.5 text-sm rounded-md mx-2 transition-colors ${
              active ? 'bg-indigo-600 text-white' : 'hover:bg-[#1a3a6b] text-slate-300'
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </>
  );
}

function HelpModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<'guide' | 'faq' | 'contact'>('guide');
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent]       = useState(false);

  const TABS = [
    { key: 'guide',   label: 'Kullanım Kılavuzu' },
    { key: 'faq',     label: 'S.S.S.'             },
    { key: 'contact', label: 'İletişim'           },
  ] as const;

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const subject = encodeURIComponent('ShiftPilot Destek Talebi');
    const body    = encodeURIComponent(`Ad: ${name}\nE-posta: ${email}\n\n${message}`);
    window.open(`mailto:destek@appshiftpilot.com?subject=${subject}&body=${body}`, '_blank');
    setSent(true);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white dark:bg-[#111E38] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#1E293B] max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-[#1E293B]">
          <h2 className="font-bold text-slate-900 dark:text-slate-100">Yardım</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl leading-none">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-[#1E293B]">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">

          {/* Kullanım Kılavuzu */}
          {tab === 'guide' && (
            <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
              <Section title="Giriş Yapma">
                E-posta ve şifrenizle giriş yapın. Rolünüze göre (Yönetici, Şef, Personel) farklı ekranlar açılır.
              </Section>
              <Section title="Görev Atama (Yönetici)">
                Atamalar sayfasından personele görev atayabilirsiniz. Tarih, bölge ve vardiya seçip kaydedin.
              </Section>
              <Section title="Görev Tamamlama (Personel)">
                Görevlerim sayfasında size atanan görevleri görürsünüz. Fotoğraf yükleyerek tamamlayabilirsiniz.
              </Section>
              <Section title="Onay / Red (Şef)">
                Onay Bekleyenler sayfasından personelin tamamladığı görevleri onaylayabilir veya reddedebilirsiniz.
              </Section>
              <Section title="Geri Bildirim">
                Herhangi bir hesaptan Geri Bildirim sayfasına gidin, konu seçip mesajınızı yazın. İsteğe bağlı fotoğraf ekleyebilirsiniz.
              </Section>
              <Section title="Personel Değerlendirme (Şef)">
                Değerlendirme sayfasından o gün çalışan personeli 9 kriter üzerinden 1-5 yıldızla değerlendirin.
              </Section>
            </div>
          )}

          {/* SSS */}
          {tab === 'faq' && (
            <div className="space-y-3">
              {[
                { q: 'Şifremi unuttum, ne yapmalıyım?', a: 'Giriş sayfasında "Şifremi Unuttum" bağlantısına tıklayın. E-posta adresinize sıfırlama linki gönderilecektir.' },
                { q: 'Fotoğraf yükleme çalışmıyor.', a: 'Tarayıcı kamera izninin açık olduğundan emin olun. Mobilde "Ayarlar → Uygulama → Kamera" iznini kontrol edin.' },
                { q: 'Görevim görünmüyor.', a: 'Yöneticinizin o güne görev atadığından emin olun. Sayfayı yenileyin (F5).' },
                { q: 'Personel değerlendirme sayfasında kimse çıkmıyor.', a: 'Çizelgede o gün için personelin "Çalışıyor" olarak işaretlenmiş olması gerekiyor.' },
                { q: 'Dükkan haritasında bölgeler boş görünüyor.', a: 'O gün bölgelere görev atanmamış olabilir. Atamalar sayfasından bölge seçerek görev atayın.' },
                { q: 'Bildirimler geliyor mu?', a: 'Şu an anlık bildirim sistemi aktif değil. Onay/red durumunu Görevlerim sayfasından takip edebilirsiniz.' },
              ].map((item, i) => (
                <details key={i} className="group border border-slate-200 dark:border-[#1E293B] rounded-xl overflow-hidden">
                  <summary className="flex items-center justify-between px-4 py-3 cursor-pointer text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#162543]">
                    {item.q}
                    <span className="text-slate-400 group-open:rotate-180 transition-transform text-xs">▼</span>
                  </summary>
                  <div className="px-4 pb-3 pt-1 text-sm text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-[#1E293B]">
                    {item.a}
                  </div>
                </details>
              ))}
            </div>
          )}

          {/* İletişim */}
          {tab === 'contact' && (
            sent ? (
              <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
                <span className="text-4xl">✉️</span>
                <p className="font-semibold text-slate-800 dark:text-slate-100">Mail uygulamanız açıldı!</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Mesajınızı gönderin. En kısa sürede dönüş yapacağız.</p>
                <button onClick={() => setSent(false)} className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 underline">Tekrar yaz</button>
              </div>
            ) : (
              <form onSubmit={handleSend} className="space-y-3">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  Sorun yaşıyorsanız veya öneriniz varsa bize yazın.
                </p>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Adınız</label>
                  <input
                    type="text" required value={name} onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#162543] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Adınız Soyadınız"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">E-posta</label>
                  <input
                    type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#162543] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="ornek@email.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Mesajınız</label>
                  <textarea
                    required rows={4} value={message} onChange={e => setMessage(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#162543] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    placeholder="Sorunuzu veya önerinizi yazın..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Mail Gönder
                </button>
                <p className="text-xs text-center text-slate-400 dark:text-slate-500">
                  destek@appshiftpilot.com
                </p>
              </form>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">{title}</p>
      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{children}</p>
    </div>
  );
}

function HelpButton({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="mx-2 mt-2 flex items-center gap-2 px-4 py-2.5 text-sm rounded-md text-slate-400 hover:bg-[#1a3a6b] hover:text-slate-200 transition-colors w-[calc(100%-16px)]"
    >
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Yardım
    </button>
  );
}

export default function Sidebar({ links, isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    onClose?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-52 bg-[#0e2549] text-gray-300 flex-col py-6 gap-1 shrink-0">
        <div className="flex-1 flex flex-col gap-1">
          <NavLinks links={links} pathname={pathname} />
        </div>
        <div className="border-t border-[#1a3a6b] pt-2">
          <HelpButton onOpen={() => setHelpOpen(true)} />
        </div>
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <aside className="w-64 bg-[#0e2549] text-gray-300 flex flex-col py-4 gap-1">
            <div className="flex items-center justify-between px-4 mb-2">
              <span className="text-white font-bold text-base">Menü</span>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white p-1 rounded"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 flex flex-col gap-1 overflow-y-auto">
              <NavLinks links={links} pathname={pathname} onClose={onClose} />
            </div>
            <div className="border-t border-[#1a3a6b] pt-2">
              <HelpButton onOpen={() => { onClose?.(); setHelpOpen(true); }} />
            </div>
          </aside>
          <div className="flex-1 bg-black/50" onClick={onClose} />
        </div>
      )}

      {/* Help modal */}
      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
    </>
  );
}
