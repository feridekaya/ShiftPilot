'use client';

import { useEffect, useState } from 'react';
import { Assignment } from '@/types';
import * as assignmentService from '@/services/assignments';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { CATEGORY_LABEL, CATEGORY_BADGE, CATEGORY_BORDER } from '@/lib/categoryStyles';

export default function HistoryPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  useEffect(() => {
    assignmentService.getAssignments()
      .then(setAssignments)
      .finally(() => setLoading(false));
  }, []);

  function toggle(id: number) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  }

  if (loading) return <div className="flex justify-center mt-20"><Spinner size="lg" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Görev Geçmişim</h1>
        <span className="text-xs text-gray-400">{assignments.length} görev</span>
      </div>

      {assignments.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 py-16 text-center text-gray-400">
          Henüz görev yok.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {assignments.map(a => {
            const category = a.task.category;
            const description = a.task.description;
            const isExpanded = !!expanded[a.id];
            const hasDetail = !!description;

            return (
              <div
                key={a.id}
                className={`bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden ${category ? CATEGORY_BORDER[category] : ''}`}
              >
                {/* Main row */}
                <div
                  className={`flex items-start gap-4 px-4 py-3 ${hasDetail ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                  onClick={() => hasDetail && toggle(a.id)}
                >
                  {/* Date */}
                  <div className="min-w-[72px] text-center bg-gray-50 rounded-lg px-2 py-1.5 shrink-0">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider leading-none mb-0.5">
                      {new Date(a.date + 'T12:00:00').toLocaleDateString('tr-TR', { month: 'short' })}
                    </p>
                    <p className="text-xl font-black text-gray-800 leading-none">
                      {new Date(a.date + 'T12:00:00').getDate()}
                    </p>
                    <p className="text-[10px] text-gray-400 leading-none mt-0.5">
                      {new Date(a.date + 'T12:00:00').toLocaleDateString('tr-TR', { weekday: 'short' })}
                    </p>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-sm text-gray-900 leading-snug">{a.task.title}</p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {hasDetail && (
                          <span className="text-gray-300 text-xs">{isExpanded ? '▲' : '▼'}</span>
                        )}
                        <Badge status={a.status} />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                      {a.zone && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <span className="text-gray-300">📍</span>{a.zone.name}
                        </span>
                      )}
                      {category && (
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${CATEGORY_BADGE[category]}`}>
                          {CATEGORY_LABEL[category]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded description */}
                {isExpanded && description && (
                  <div className="px-4 pb-3 pt-0 border-t border-gray-50 bg-gray-50/60">
                    <p className="text-xs text-gray-500 leading-relaxed pt-2">{description}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
