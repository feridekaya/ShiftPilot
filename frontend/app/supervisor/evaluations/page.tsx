'use client';

import { useState, useEffect, useCallback } from 'react';
import * as svc from '@/services/evaluations';
import { DailyEmployee } from '@/types';

const CRITERIA: { key: string; label: string }[] = [
  { key: 'punctuality',       label: 'Dakiklik'                },
  { key: 'break_compliance',  label: 'Mola uyumu'              },
  { key: 'customer_comm',     label: 'Müşteri iletişimi'       },
  { key: 'speed_agility',     label: 'Hız / çeviklik'          },
  { key: 'teamwork',          label: 'Takım çalışması'         },
  { key: 'hygiene_uniform',   label: 'Hijyen / üniforma'       },
  { key: 'problem_solving',   label: 'Problem çözme'           },
  { key: 'feedback_openness', label: 'Geri bildirime açıklık'  },
  { key: 'energy_motivation', label: 'Enerji / motivasyon'     },
];

type Scores = Record<string, number>;

function emptyScores(): Scores {
  return Object.fromEntries(CRITERIA.map(c => [c.key, 0]));
}

function StarRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="w-44 text-sm text-slate-600 dark:text-slate-400 shrink-0">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="text-xl leading-none focus:outline-none transition-colors"
          >
            <span className={(hover || value) >= star ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'}>
              ★
            </span>
          </button>
        ))}
      </div>
      {value > 0 && (
        <span className="text-xs text-slate-400 ml-1">{value}/5</span>
      )}
    </div>
  );
}

function EvalForm({
  employee,
  date,
  onDone,
  onCancel,
}: {
  employee: DailyEmployee;
  date: string;
  onDone: (updated: DailyEmployee) => void;
  onCancel: () => void;
}) {
  const [scores, setScores] = useState<Scores>(emptyScores());
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const allFilled = CRITERIA.every(c => (scores[c.key] ?? 0) > 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!allFilled) { setError('Lütfen tüm kriterleri puanlayın.'); return; }
    setSaving(true);
    setError('');
    try {
      const ev = await svc.createEvaluation({
        evaluatee: employee.id,
        date,
        punctuality:       scores.punctuality,
        break_compliance:  scores.break_compliance,
        customer_comm:     scores.customer_comm,
        speed_agility:     scores.speed_agility,
        teamwork:          scores.teamwork,
        hygiene_uniform:   scores.hygiene_uniform,
        problem_solving:   scores.problem_solving,
        feedback_openness: scores.feedback_openness,
        energy_motivation: scores.energy_motivation,
        note: note.trim() || undefined,
      });
      const avg = Object.values(scores).reduce((a, b) => a + b, 0) / CRITERIA.length;
      onDone({
        ...employee,
        evaluated: true,
        evaluation_id: ev.id,
        evaluator_name: ev.evaluator_name,
        avg_score: Math.round(avg * 10) / 10,
      });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg || 'Bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="w-full max-w-md bg-white dark:bg-[#111E38] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#1E293B] max-h-[92vh] overflow-y-auto">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-[#1E293B] flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">{employee.name}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Günlük değerlendirme · {date}</p>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl leading-none">✕</button>
        </div>

        <form onSubmit={submit} className="px-5 py-4 space-y-1">
          {CRITERIA.map(c => (
            <StarRow
              key={c.key}
              label={c.label}
              value={scores[c.key] ?? 0}
              onChange={v => setScores(prev => ({ ...prev, [c.key]: v }))}
            />
          ))}

          <div className="pt-3">
            <input
              type="text"
              maxLength={300}
              placeholder="Şef notu (isteğe bağlı, 1 cümle)"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#162543] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {error && <p className="text-red-500 text-xs pt-1">{error}</p>}

          <div className="flex gap-2 pt-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-[#1E293B] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1E293B]"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={saving || !allFilled}
              className="flex-1 px-4 py-2 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium transition-colors"
            >
              {saving ? 'Kaydediliyor…' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 4.5 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
    score >= 3   ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      ★ {score.toFixed(1)}
    </span>
  );
}

export default function EvaluationsPage() {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [employees, setEmployees] = useState<DailyEmployee[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<DailyEmployee | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await svc.getDailyEmployees(date);
      setEmployees(list);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { load(); }, [load]);

  function handleDone(updated: DailyEmployee) {
    setEmployees(prev => prev.map(e => e.id === updated.id ? updated : e));
    setSelected(null);
  }

  const evaluated = employees.filter(e => e.evaluated);
  const pending   = employees.filter(e => !e.evaluated);

  return (
    <div className="max-w-2xl mx-auto py-4 sm:py-6 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Personel Değerlendirme</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {employees.length} personel · {evaluated.length} değerlendirildi
          </p>
        </div>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="ml-auto px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#162543] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      )}

      {!loading && employees.length === 0 && (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
          <p className="text-4xl mb-3">📋</p>
          <p>Bu tarihte görevlendirilmiş personel bulunamadı.</p>
        </div>
      )}

      {/* Pending employees */}
      {!loading && pending.length > 0 && (
        <div className="bg-white dark:bg-[#111E38] rounded-2xl border border-slate-200 dark:border-[#1E293B] overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#162543]">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Bekleyen</h2>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-[#1E293B]">
            {pending.map(emp => (
              <li
                key={emp.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-[#162543] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-semibold text-sm">
                    {emp.name[0]}
                  </div>
                  <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">{emp.name}</span>
                </div>
                <button
                  onClick={() => setSelected(emp)}
                  className="px-3 py-1.5 text-xs rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors"
                >
                  Değerlendir
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Evaluated employees */}
      {!loading && evaluated.length > 0 && (
        <div className="bg-white dark:bg-[#111E38] rounded-2xl border border-slate-200 dark:border-[#1E293B] overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#162543]">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Değerlendirildi</h2>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-[#1E293B]">
            {evaluated.map(emp => (
              <li key={emp.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 font-semibold text-sm">
                    {emp.name[0]}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">{emp.name}</p>
                    {emp.evaluator_name && (
                      <p className="text-xs text-slate-400">{emp.evaluator_name} tarafından</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {emp.avg_score !== undefined && <ScoreBadge score={emp.avg_score} />}
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">✓</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Eval form modal */}
      {selected && (
        <EvalForm
          employee={selected}
          date={date}
          onDone={handleDone}
          onCancel={() => setSelected(null)}
        />
      )}
    </div>
  );
}
