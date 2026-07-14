'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api';

type LogEntry = {
  id: number;
  created_at: string;
  action: string;
  action_display: string;
  actor_name: string;
  target_user_name: string;
  task_title: string;
  business_date: string | null;
  note: string;
};

const ACTION_STYLES: Record<string, { label: string; dot: string; badge: string }> = {
  assigned:      { label: 'Atandı',         dot: 'bg-indigo-500',  badge: 'bg-indigo-900/40 text-indigo-300 border-indigo-800/40' },
  bulk_assigned: { label: 'Toplu Atama',    dot: 'bg-violet-500',  badge: 'bg-violet-900/40 text-violet-300 border-violet-800/40' },
  reassigned:    { label: 'Yeniden Atandı', dot: 'bg-amber-500',   badge: 'bg-amber-900/40 text-amber-300 border-amber-800/40'   },
  completed:     { label: 'Tamamlandı',     dot: 'bg-blue-500',    badge: 'bg-blue-900/40 text-blue-300 border-blue-800/40'      },
  approved:      { label: 'Onaylandı',      dot: 'bg-emerald-500', badge: 'bg-emerald-900/40 text-emerald-300 border-emerald-800/40' },
  rejected:      { label: 'Reddedildi',     dot: 'bg-red-500',     badge: 'bg-red-900/40 text-red-300 border-red-800/40'         },
  deleted:       { label: 'Silindi',        dot: 'bg-gray-500',    badge: 'bg-gray-800/60 text-gray-400 border-gray-700/40'      },
};

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function ActivityPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [dateFilter, setDateFilter] = useState(new Date().toLocaleDateString('en-CA'));

  async function load() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (actionFilter) params.action = actionFilter;
      if (dateFilter) params.business_date = dateFilter;
      const res = await api.get('/api/assignments/activity/', { params });
      setLogs(res.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [actionFilter, dateFilter]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <p className="text-gray-500 dark:text-slate-500 text-xs uppercase tracking-widest mb-1">Yönetim</p>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Etkinlik Günlüğü</h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Kim ne yaptı, ne zaman, hangi görev üzerinde</p>
      </div>

      {/* Filtreler */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Tüm eylemler</option>
          <option value="assigned">Atandı</option>
          <option value="bulk_assigned">Toplu Atama</option>
          <option value="completed">Tamamlandı</option>
          <option value="approved">Onaylandı</option>
          <option value="rejected">Reddedildi</option>
          <option value="deleted">Silindi</option>
        </select>

        <input
          type="date"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        {(actionFilter || dateFilter) && (
          <button
            onClick={() => { setActionFilter(''); setDateFilter(''); }}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-sm hover:text-gray-900 dark:hover:text-white"
          >
            Filtreyi Temizle
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-slate-500">
          Etkinlik kaydı bulunamadı.
        </div>
      ) : (
        <div className="relative">
          {/* Dikey çizgi */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />

          <div className="flex flex-col gap-1">
            {logs.map((log) => {
              const style = ACTION_STYLES[log.action] ?? ACTION_STYLES.assigned;
              return (
                <div key={log.id} className="relative pl-12 py-3">
                  {/* Nokta */}
                  <div className={`absolute left-2.5 top-4 w-3 h-3 rounded-full ${style.dot} ring-2 ring-white dark:ring-gray-900`} />

                  <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                    <div className="flex flex-wrap items-start gap-2 mb-1">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${style.badge}`}>
                        {style.label}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-slate-500 ml-auto shrink-0">
                        {formatTime(log.created_at)}
                      </span>
                    </div>

                    <p className="text-sm text-gray-900 dark:text-white">
                      <span className="font-semibold">{log.actor_name}</span>
                      {log.action === 'approved' && <> → <span className="text-emerald-600 dark:text-emerald-400 font-medium">onayladı</span></>}
                      {log.action === 'rejected' && <> → <span className="text-red-600 dark:text-red-400 font-medium">reddetti</span></>}
                      {log.action === 'completed' && <> görevi tamamladı</>}
                      {(log.action === 'assigned' || log.action === 'bulk_assigned') && (
                        <> → <span className="font-medium text-indigo-600 dark:text-indigo-400">{log.target_user_name}</span> kişisine atadı</>
                      )}
                      {log.action === 'deleted' && (
                        <> → <span className="font-medium">{log.target_user_name}</span> atamasını sildi</>
                      )}
                    </p>

                    {log.task_title && (
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                        Görev: <span className="font-medium text-gray-700 dark:text-slate-300">{log.task_title}</span>
                        {log.business_date && (
                          <span className="ml-2 text-gray-400 dark:text-slate-500">
                            {new Date(log.business_date + 'T00:00:00').toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}
                          </span>
                        )}
                      </p>
                    )}

                    {log.note && (
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 italic">
                        Not: {log.note}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
