'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import * as assignmentService from '@/services/assignments';
import { UserPerformance } from '@/services/assignments';
import Spinner from '@/components/ui/Spinner';

function toISO(d: Date) { return d.toLocaleDateString('en-CA'); }
function firstDayOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }

const TR_MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

function StatCard({ label, value, sub, color }: {
  label: string; value: string; sub: string;
  color: 'indigo' | 'emerald' | 'amber' | 'rose' | 'violet';
}) {
  const colors = {
    indigo:  'bg-indigo-50  border-indigo-100  text-indigo-700',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    amber:   'bg-amber-50   border-amber-100   text-amber-700',
    rose:    'bg-rose-50    border-rose-100    text-rose-700',
    violet:  'bg-violet-50  border-violet-100  text-violet-700',
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-xs font-medium opacity-60 mb-1">{label}</p>
      <p className="text-2xl font-black tracking-tight">{value}</p>
      <p className="text-xs opacity-50 mt-0.5">{sub}</p>
    </div>
  );
}

function RateBar({ label, value, invert = false }: { label: string; value: number | null; invert?: boolean }) {
  if (value === null) return null;
  const good = invert ? value <= 20 : value >= 80;
  const ok   = invert ? value <= 40 : value >= 60;
  const color = good ? 'bg-emerald-500' : ok ? 'bg-amber-400' : 'bg-rose-400';
  const textColor = good ? 'text-emerald-700' : ok ? 'text-amber-700' : 'text-rose-600';
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <p className="text-sm text-gray-600">{label}</p>
        <p className={`text-sm font-bold ${textColor}`}>{value}%</p>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${color}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default function EmployeePerformancePage() {
  const { user } = useAuth();
  const today = new Date();
  const [dateFrom, setDateFrom] = useState(toISO(firstDayOfMonth(today)));
  const [dateTo, setDateTo] = useState(toISO(today));
  const [data, setData] = useState<UserPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [calMonth, setCalMonth] = useState({ year: today.getFullYear(), month: today.getMonth() });

  async function load(from: string, to: string) {
    if (!user) return;
    setLoading(true);
    const rows = await assignmentService.getPerformance({ date_from: from, date_to: to });
    setData(rows.find(r => r.user_id === user.id) ?? null);
    setLoading(false);
  }

  useEffect(() => { load(dateFrom, dateTo); }, [user]);

  function selectMonth(year: number, month: number) {
    const from = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const to = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    setDateFrom(from); setDateTo(to);
    load(from, to);
  }

  return (
    <div className="max-w-xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Performansım</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kişisel görev istatistikleri</p>
        </div>
      </div>

      {/* Month picker */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 mb-6 shadow-sm">
        <button
          onClick={() => {
            const d = new Date(calMonth.year, calMonth.month - 1);
            setCalMonth({ year: d.getFullYear(), month: d.getMonth() });
            selectMonth(d.getFullYear(), d.getMonth());
          }}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 font-bold"
        >‹</button>
        <p className="font-semibold text-gray-800">{TR_MONTHS[calMonth.month]} {calMonth.year}</p>
        <button
          onClick={() => {
            const d = new Date(calMonth.year, calMonth.month + 1);
            setCalMonth({ year: d.getFullYear(), month: d.getMonth() });
            selectMonth(d.getFullYear(), d.getMonth());
          }}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 font-bold"
        >›</button>
      </div>

      {loading ? (
        <div className="flex justify-center mt-20"><Spinner size="lg" /></div>
      ) : !data ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 py-16 text-center text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-sm">Bu dönemde görev kaydı bulunamadı.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Toplam Görev"   value={String(data.total_assignments)} sub="atama"       color="indigo"  />
            <StatCard label="Tamamlanan"      value={String(data.completed)}         sub="görev"       color="violet"  />
            <StatCard label="Onaylanan"       value={String(data.approved)}          sub="görev"       color="emerald" />
            <StatCard label="Toplam Katsayı"  value={data.total_coefficient.toFixed(1)} sub="iş yükü" color="amber"   />
          </div>

          {/* Rate bars */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
            <p className="text-sm font-semibold text-gray-700">Oranlar</p>
            <RateBar label="Tamamlanma oranı" value={data.completion_rate} />
            <RateBar label="Onay oranı"       value={data.approval_rate} />
            <RateBar label="Tekrar yapılsın oranı" value={data.redo_rate} invert />
          </div>

          {/* Detail row */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm font-semibold text-gray-700 mb-4">Detay</p>
            <div className="flex flex-col divide-y divide-gray-50">
              {[
                { label: 'Bekleyen görev',          value: data.pending },
                { label: 'Reddedilen / tekrar',     value: data.rejected },
                { label: 'Toplam fotoğraf gönderimi', value: data.total_submissions },
                { label: 'Görev başına ort. deneme', value: data.avg_submissions_per_task?.toFixed(2) ?? '—' },
                { label: 'Tekrar kaydı',            value: data.redo_count },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-2.5">
                  <p className="text-sm text-gray-500">{label}</p>
                  <p className="text-sm font-semibold text-gray-800">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Info note */}
          <p className="text-xs text-gray-400 text-center">
            {dateFrom} – {dateTo} tarihleri arası veriler
          </p>
        </div>
      )}
    </div>
  );
}
